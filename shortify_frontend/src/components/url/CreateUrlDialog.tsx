import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Calendar, Link2, Zap } from "lucide-react"
import { type CreateUrlFormData, CreateUrlSchema, normalizeUrl } from "../../lib/validators/url.schema"
import { useCreateUrl } from "../../hooks/useUrls"
import type { URLCreate } from "../../types/url"

interface CreateUrlDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateUrlDialog: React.FC<CreateUrlDialogProps> = ({ isOpen, onClose }) => {
  const createMutation = useCreateUrl()
  const [hasExpiry, setHasExpiry] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUrlFormData>({
    resolver: zodResolver(CreateUrlSchema),
    defaultValues: {
      has_expiry: false,
    },
  })

  if (!isOpen) return null

  const handleClose = () => {
    reset()
    setHasExpiry(false)
    onClose()
  }

  const onSubmit = async (data: CreateUrlFormData) => {
    // No expiry selected -> omit it; the backend treats a missing expires_at as "never expires"
    let expiresAt: string | undefined = undefined

    if (hasExpiry) {
      const expiry = data.expires_at ? new Date(data.expires_at) : null
      if (!expiry || Number.isNaN(expiry.getTime())) {
        setError("expires_at", { message: "Pick an expiration date or turn expiry off" })
        return
      }
      if (expiry.getTime() <= Date.now()) {
        setError("expires_at", { message: "Expiration date must be in the future" })
        return
      }
      expiresAt = expiry.toISOString()
    }

    const payload: URLCreate = {
      long_url: normalizeUrl(data.long_url),
      custom_alias: data.custom_alias ? data.custom_alias.trim() : undefined,
      title: data.title ? data.title.trim() : undefined,
      expires_at: expiresAt,
    }

    createMutation.mutate(payload, {
      onSuccess: handleClose,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 shadow-2xl space-y-6 relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-medium text-base text-text-primary">Create Short Link</h2>
              <p className="text-xs text-text-muted">Shorten URLs with custom alias & analytics.</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Destination URL <span className="text-destructive">*</span>
            </label>
            <input
              {...register("long_url")}
              type="url"
              placeholder="google.com or https://example.com/destination"
              disabled={createMutation.isPending}
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-text-primary text-xs placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
            />
            {errors.long_url && (
              <p className="mt-1 text-xs text-destructive">{errors.long_url.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Title <span className="text-text-faint">(Optional)</span>
            </label>
            <input
              {...register("title")}
              type="text"
              placeholder="Campaign Launch 2026"
              disabled={createMutation.isPending}
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-text-primary text-xs placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Custom Alias <span className="text-text-faint">(Optional)</span>
            </label>
            <div className="flex items-center gap-1 bg-bg border border-border rounded-md px-3 py-2 text-xs font-mono">
              <span className="text-text-faint select-none">your-domain/</span>
              <input
                {...register("custom_alias")}
                type="text"
                placeholder="my-link"
                disabled={createMutation.isPending}
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-faint focus:outline-none"
              />
            </div>
            {errors.custom_alias && (
              <p className="mt-1 text-xs text-destructive">{errors.custom_alias.message}</p>
            )}
          </div>

          {/* INTEGRATED SINGLE CONTAINER EXPIRATION CARD */}
          <div className="bg-bg border border-border rounded-xl p-3.5 transition-all">
            <div
              onClick={() => setHasExpiry(!hasExpiry)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <div className="text-xs font-medium text-text-primary">Set Expiration Date</div>
                  <div className="text-[11px] text-text-faint">Auto-deactivate link after specified time</div>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <div
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  hasExpiry ? "bg-accent" : "bg-surface-raised border border-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    hasExpiry ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {hasExpiry && (
              <div className="mt-3 pt-3 border-t border-border/50 animate-in fade-in duration-150">
                <input
                  {...register("expires_at")}
                  type="datetime-local"
                  disabled={createMutation.isPending}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-border text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
                {errors.expires_at && (
                  <p className="mt-1 text-xs text-destructive">{errors.expires_at.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface-raised text-text-muted hover:text-text-primary text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-accent/20"
            >
              {createMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Create Link</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
