import { create } from "zustand"
import type { UserResponse } from "../types/auth"

interface AuthState {
  accessToken: string | null
  user: UserResponse | null
  isRehydrating: boolean
  setSession: (accessToken: string, refreshToken: string, user: UserResponse) => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: UserResponse) => void
  clearSession: () => void
  setRehydrating: (isRehydrating: boolean) => void
  getRefreshToken: () => string | null
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isRehydrating: true,

  setSession: (accessToken, refreshToken, user) => {
    localStorage.setItem("shortify_refresh_token", refreshToken)
    set({ accessToken, user, isRehydrating: false })
  },

  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),

  clearSession: () => {
    localStorage.removeItem("shortify_refresh_token")
    set({ accessToken: null, user: null, isRehydrating: false })
  },

  setRehydrating: (isRehydrating) => set({ isRehydrating }),

  getRefreshToken: () => localStorage.getItem("shortify_refresh_token"),
}))
