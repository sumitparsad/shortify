import React, { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/auth.store"
import { apiClient } from "../../lib/api/client"
import type { TokenResponse, UserResponse } from "../../types/auth"

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { accessToken, isRehydrating, setSession, clearSession, setRehydrating, getRefreshToken } =
    useAuthStore()
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    const rehydrateAuth = async () => {
      const refreshToken = getRefreshToken()

      if (!refreshToken || accessToken) {
        if (isMounted) setRehydrating(false)
        return
      }

      try {
        const { data: tokenData } = await apiClient.post<TokenResponse>("/auth/refresh", {
          refresh_token: refreshToken,
        })

        const { data: userData } = await apiClient.get<UserResponse>("/auth/me", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })

        if (isMounted) {
          setSession(tokenData.access_token, tokenData.refresh_token, userData)
        }
      } catch {
        if (isMounted) {
          clearSession()
        }
      } finally {
        if (isMounted) setRehydrating(false)
      }
    }

    rehydrateAuth()

    return () => {
      isMounted = false
    }
  }, [accessToken, setSession, clearSession, setRehydrating, getRefreshToken])

  if (isRehydrating) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
