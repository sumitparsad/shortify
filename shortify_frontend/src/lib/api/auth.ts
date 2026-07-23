import { apiClient } from "./client"
import type { APIResponse, LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "../../types/auth"

export async function registerUser(data: RegisterRequest): Promise<UserResponse> {
  const response = await apiClient.post<UserResponse>("/auth/register", data)
  return response.data
}

export async function loginUser(data: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/login", data)
  return response.data
}

export async function refreshToken(refreshTokenStr: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshTokenStr,
  })
  return response.data
}

export async function logoutUser(refreshTokenStr: string): Promise<APIResponse> {
  const response = await apiClient.post<APIResponse>("/auth/logout", {
    refresh_token: refreshTokenStr,
  })
  return response.data
}

export async function getMe(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>("/auth/me")
  return response.data
}
