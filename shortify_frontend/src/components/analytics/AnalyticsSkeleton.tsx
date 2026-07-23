import React from "react"

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-surface border border-border space-y-2">
            <div className="h-3 w-24 bg-surface-raised rounded" />
            <div className="h-8 w-16 bg-surface-raised/80 rounded" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-xl bg-surface border border-border" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 rounded-xl bg-surface border border-border" />
        <div className="h-48 rounded-xl bg-surface border border-border" />
      </div>
    </div>
  )
}
