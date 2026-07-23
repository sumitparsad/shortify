import React, { useState } from "react"
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import { UrlCard } from "./UrlCard"
import { UrlListSkeleton } from "./UrlListSkeleton"
import { EmptyState } from "../shared/EmptyState"
import type { URLResponse } from "../../types/url"

interface UrlListProps {
  items: URLResponse[]
  total: number
  page: number
  pages: number
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  onPageChange: (newPage: number) => void
  onSelectUrl?: (url: URLResponse) => void
  onEditUrl?: (url: URLResponse) => void
  onDeleteUrl?: (url: URLResponse) => void
  onCreateClick?: () => void
}

export const UrlList: React.FC<UrlListProps> = ({
  items,
  total: _total,
  page,
  pages,
  isLoading,
  isError,
  errorMessage,
  onPageChange,
  onSelectUrl,
  onEditUrl,
  onDeleteUrl,
  onCreateClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "custom">("all")

  // Robust Space-Aware Search & Filter
  const filteredItems = items.filter((item) => {
    // Status Filter Check
    if (statusFilter === "active" && !item.is_active) return false
    if (statusFilter === "inactive" && item.is_active) return false
    if (statusFilter === "custom" && !item.is_custom_alias) return false

    // Space-Aware Tokenized Query Match
    const trimmedQuery = searchTerm.trim().toLowerCase().replace(/\s+/g, " ")
    if (!trimmedQuery) return true

    const tokens = trimmedQuery.split(" ")
    const targetText = `${item.title || ""} ${item.slug} ${item.long_url} ${item.short_url}`.toLowerCase()

    // Every search word token must exist in target text
    return tokens.every((token) => targetText.includes(token))
  })

  if (isLoading) {
    return <UrlListSkeleton />
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load links"
        description={errorMessage || "Unable to reach the server. Please check your backend connection."}
        action={
          <button
            onClick={() => onPageChange(page)}
            className="px-4 py-2 rounded-md bg-accent text-white text-xs font-medium"
          >
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, slug, short link, or destination..."
            className="w-full pl-9 pr-8 py-2 bg-surface border border-border rounded-md text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: "all", label: "All Links" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
            { id: "custom", label: "Custom Alias" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-colors font-medium text-xs ${
                statusFilter === tab.id
                  ? "bg-surface-raised border border-border text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No matching links found" : "No links created yet"}
          description={
            searchTerm || statusFilter !== "all"
              ? `No links matched your search criteria.`
              : "Create your first shortened URL to start tracking click traffic."
          }
          action={
            onCreateClick && (
              <button
                onClick={onCreateClick}
                className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
              >
                + Create Short Link
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((url) => (
            <UrlCard
              key={url.id}
              url={url}
              onSelect={onSelectUrl}
              onEdit={onEditUrl}
              onDelete={onDeleteUrl}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs text-text-muted">
          <span>
            Page <strong className="text-text-primary">{page}</strong> of{" "}
            <strong className="text-text-primary">{pages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded bg-surface border border-border disabled:opacity-40 hover:text-text-primary transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded bg-surface border border-border disabled:opacity-40 hover:text-text-primary transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
