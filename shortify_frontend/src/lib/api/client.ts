import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "../../store/auth.store"
import type { TokenResponse, UserResponse } from "../../types/auth"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh tokens are single-use (the backend revokes each one on refresh), so every
// caller — the 401 interceptor, AuthGuard on page load, concurrent requests —
// must share one in-flight refresh instead of each spending the same token.
let refreshInFlight: Promise<string> | null = null

/** Exchanges the stored refresh token for a new session. Returns the new access token. */
export function refreshSession(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = useAuthStore.getState().getRefreshToken()
      if (!refreshToken) throw new Error("No refresh token")

      const { data } = await axios.post<TokenResponse>(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      const { data: user } = await axios.get<UserResponse>(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })

      useAuthStore.getState().setSession(data.access_token, data.refresh_token, user)
      return data.access_token
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

// Response Interceptor: Silent Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      const accessToken = await refreshSession()
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(originalRequest)
    } catch (refreshErr) {
      useAuthStore.getState().clearSession()
      return Promise.reject(refreshErr)
    }
  }
)

/**
 * Normalizes error messages from backend responses (handles custom { success, error } and Pydantic { detail }).
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (!data) {
      return error.message || "An unexpected network error occurred."
    }

    // Custom backend shape: { success: false, error: "..." }
    if (typeof data.error === "string") {
      return data.error
    }

    // Pydantic validation shape: { detail: "..." } or { detail: [{ loc, msg }] }
    if (typeof data.detail === "string") {
      return data.detail
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0]
      if (typeof first.msg === "string") {
        return first.msg
      }
    }

    if (data.message && typeof data.message === "string") {
      return data.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred."
}
