import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { type RegisterFormData, RegisterSchema } from "../../lib/validators/auth.schema"
import { registerUser, loginUser, getMe } from "../../lib/api/auth"
import { useAuthStore } from "../../store/auth.store"
import { extractErrorMessage } from "../../lib/api/client"

export const RegisterForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
  })

  const passwordValue = watch("password", "")

  const hasMinLength = passwordValue.length >= 8
  const hasUppercase = /[A-Z]/.test(passwordValue)
  const hasDigit = /[0-9]/.test(passwordValue)

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await registerUser(data)
      // Auto login after successful registration
      const tokenRes = await loginUser({ email: data.email, password: data.password })
      useAuthStore.getState().setAccessToken(tokenRes.access_token)
      const userRes = await getMe()
      setSession(tokenRes.access_token, tokenRes.refresh_token, userRes)
      toast.success("Account created successfully!")
      navigate("/dashboard")
    } catch (err) {
      const msg = extractErrorMessage(err)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          Email address
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          disabled={isLoading}
          className="w-full px-3 py-2 rounded-md bg-surface border border-border text-text-primary text-sm placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          Username
        </label>
        <input
          {...register("username")}
          type="text"
          placeholder="sumit"
          disabled={isLoading}
          className="w-full px-3 py-2 rounded-md bg-surface border border-border text-text-primary text-sm placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
        />
        {errors.username && (
          <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isLoading}
            className="w-full px-3 py-2 pr-9 rounded-md bg-surface border border-border text-text-primary text-sm placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-text-faint hover:text-text-muted transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
        )}

        {/* Password Strength Checklist */}
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={hasMinLength ? "text-success" : "text-text-faint"}>
              {hasMinLength ? "✓" : "○"} At least 8 characters
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={hasUppercase ? "text-success" : "text-text-faint"}>
              {hasUppercase ? "✓" : "○"} At least 1 uppercase letter
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={hasDigit ? "text-success" : "text-text-faint"}>
              {hasDigit ? "✓" : "○"} At least 1 number
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create account</span>
        )}
      </button>

      <p className="text-center text-xs text-text-muted mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
