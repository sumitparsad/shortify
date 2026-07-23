import React from "react"

export const UrlListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-5 rounded-lg bg-surface border border-border animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 bg-surface-raised rounded" />
            <div className="h-4 w-16 bg-surface-raised rounded" />
          </div>
          <div className="h-3 w-64 bg-surface-raised/60 rounded" />
          <div className="flex items-center justify-between pt-2">
            <div className="h-6 w-36 bg-surface-raised rounded" />
            <div className="h-4 w-24 bg-surface-raised/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
