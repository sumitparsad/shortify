import React from "react"
import { AlertTriangle } from "lucide-react"
import { useDeleteUrl } from "../../hooks/useUrls"
import type { URLResponse } from "../../types/url"

interface DeleteUrlAlertProps {
  url: URLResponse | null
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
}

export const DeleteUrlAlert: React.FC<DeleteUrlAlertProps> = ({
  url,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const deleteMutation = useDeleteUrl()

  if (!isOpen || !url) return null

  const handleDelete = () => {
    deleteMutation.mutate(url.slug, {
      onSuccess: () => {
        onClose()
        onDeleted?.()
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="font-display font-medium text-lg text-text-primary">Delete Short Link?</h3>
          <p className="text-xs text-text-muted">
            Are you sure you want to permanently delete{" "}
            <span className="font-mono text-accent">{url.short_url}</span>?{" "}
            This cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-full py-2 px-4 rounded-md border border-border bg-surface hover:bg-surface-raised text-text-muted hover:text-text-primary text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full py-2 px-4 rounded-md bg-destructive hover:bg-destructive/90 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {deleteMutation.isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Delete Link</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
