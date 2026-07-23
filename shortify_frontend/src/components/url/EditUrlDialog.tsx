import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Save, Calendar, Power } from "lucide-react"
import { type UpdateUrlFormData, UpdateUrlSchema, normalizeUrl } from "../../lib/validators/url.schema"
import { useUpdateUrl } from "../../hooks/useUrls"
import type { URLResponse, URLUpdate } from "../../types/url"

interface EditUrlDialogProps {
  url: URLResponse | null
  isOpen: boolean
  onClose: () => void
}

export const EditUrlDialog: React.FC<EditUrlDialogProps> = ({ url, isOpen, onClose }) => {
  const updateMutation = useUpdateUrl()
  const [isActive, setIsActive] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUrlFormData>({
    resolver: zodResolver(UpdateUrlSchema),
  })

  useEffect(() => {
    if (url) {
      reset({
        long_url: url.long_url,
        title: url.title || "",
        expires_at: url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : "",
      })
      setIsActive(url.is_active)
    }
  }, [url, reset])

  if (!isOpen || !url) return null

  const onSubmit = async (data: UpdateUrlFormData) => {
    const payload: URLUpdate = {
      long_url: data.long_url ? normalizeUrl(data.long_url) : undefined,
      title: data.title ? data.title.trim() : undefined,
      is_active: isActive,
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
    }

    updateMutation.mutate(
      { slug: url.slug, data: payload },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 shadow-2xl space-y-6 relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-medium text-lg text-text-primary">Edit Short Link</h2>
            <p className="text-xs font-mono text-text-muted">shortify.to/{url.slug}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Destination URL</label>
            <input
              {...register("long_url")}
              type="url"
              placeholder="google.com or https://example.com/destination"
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-text-primary text-xs placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
            />
            {errors.long_url && (
              <p className="mt-1 text-xs text-destructive">{errors.long_url.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Title</label>
            <input
              {...register("title")}
              type="text"
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-text-primary text-xs placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors disabled:opacity-50"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-md bg-bg border border-border">
            <div className="flex items-center gap-2 text-xs">
              <Power className={`w-4 h-4 ${isActive ? "text-success" : "text-destructive"}`} />
              <span className="font-medium text-text-primary">
                Status: {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                isActive ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-success/10 text-success border border-success/20"
              }`}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-faint" />
              <span>Expiration Date</span>
            </label>
            <input
              {...register("expires_at")}
              type="datetime-local"
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface-raised text-text-muted hover:text-text-primary text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
