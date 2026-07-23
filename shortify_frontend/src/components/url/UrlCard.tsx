import React from "react"
import { ExternalLink, BarChart2, Calendar, MousePointer, Edit2, Trash2, Power } from "lucide-react"
import { SlugChip } from "./SlugChip"
import { QrCodeButton } from "./QrCodeButton"
import { StatusBadge } from "../shared/StatusBadge"
import { formatDate, formatNumber } from "../../lib/utils"
import { useUpdateUrl } from "../../hooks/useUrls"
import type { URLResponse } from "../../types/url"

interface UrlCardProps {
  url: URLResponse
  onSelect?: (url: URLResponse) => void
  onEdit?: (url: URLResponse) => void
  onDelete?: (url: URLResponse) => void
}

export const UrlCard: React.FC<UrlCardProps> = ({ url, onSelect, onEdit, onDelete }) => {
  const updateMutation = useUpdateUrl()
  const shortDomain = import.meta.env.VITE_SHORT_URL_BASE
    ? `${import.meta.env.VITE_SHORT_URL_BASE.replace(/^https?:\/\//, "")}/`
    : "http://localhost:8000/"

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateMutation.mutate({
      slug: url.slug,
      data: { is_active: !url.is_active },
    })
  }

  return (
    <div
      onClick={() => onSelect?.(url)}
      className={`p-5 rounded-xl border transition-all space-y-4 cursor-pointer ${
        url.is_active
          ? "bg-surface border-border hover:border-accent/40"
          : "bg-surface/50 border-border/60 opacity-85 hover:opacity-100"
      }`}
    >
      {/* Header: Title & Status */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-base text-text-primary hover:text-accent transition-colors truncate">
              {url.title || url.slug}
            </h3>
          </div>
          <a
            href={url.long_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors truncate max-w-lg"
          >
            <span className="truncate">{url.long_url}</span>
            <ExternalLink className="w-3 h-3 shrink-0 text-text-faint" />
          </a>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge
            isActive={url.is_active}
            expiresAt={url.expires_at}
            isCustomAlias={url.is_custom_alias}
          />

          {/* Quick Toggle Active Button */}
          <button
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1 ${
              url.is_active
                ? "bg-surface-raised border-border text-text-muted hover:text-destructive hover:border-destructive/30"
                : "bg-success/15 border-success/30 text-success hover:bg-success hover:text-white"
            }`}
            title={url.is_active ? "Deactivate Link" : "Activate Link"}
          >
            <Power className="w-3 h-3" />
            <span>{url.is_active ? "Deactivate" : "Activate"}</span>
          </button>

          {/* Action Quick Buttons */}
          <div className="flex items-center gap-1">
            <QrCodeButton url={url.short_url} slug={url.slug} />

            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(url)
                }}
                className="p-1.5 rounded-md hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors"
                title="Edit Link"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(url)
                }}
                className="p-1.5 rounded-md hover:bg-surface-raised text-text-muted hover:text-destructive transition-colors"
                title="Delete Link"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body: SlugChip & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
        <div onClick={(e) => e.stopPropagation()}>
          <SlugChip slug={url.slug} domain={shortDomain} fullUrl={url.short_url} />
        </div>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5 font-mono" title="Total clicks">
            <MousePointer className="w-3.5 h-3.5 text-accent" />
            <span className="text-text-primary font-medium">{formatNumber(url.click_count)}</span>
            <span className="text-text-faint font-sans">clicks</span>
          </div>

          {url.expires_at && (
            <div className="flex items-center gap-1.5 text-text-faint" title="Expires at">
              <Calendar className="w-3.5 h-3.5" />
              <span>Exp: {formatDate(url.expires_at)}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-text-faint" title="View Analytics">
            <BarChart2 className="w-3.5 h-3.5 text-text-muted hover:text-accent transition-colors" />
          </div>
        </div>
      </div>
    </div>
  )
}
