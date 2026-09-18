import React, { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/auth.store"
import { refreshSession } from "../../lib/api/client"

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { accessToken, isRehydrating, clearSession, setRehydrating, getRefreshToken } = useAuthStore()
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
        // Shared single-flight refresh: StrictMode's double effect and any concurrent
        // 401 retries reuse one request, so the single-use refresh token isn't spent twice.
        await refreshSession()
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
  }, [accessToken, clearSession, setRehydrating, getRefreshToken])

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
