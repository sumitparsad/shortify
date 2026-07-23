import React from "react"
import { formatNumber } from "../../lib/utils"

interface BreakdownItem {
  name: string
  clicks: number
}

interface BreakdownBarChartProps {
  title: string
  items: BreakdownItem[]
  totalClicks: number
}

export const BreakdownBarChart: React.FC<BreakdownBarChartProps> = ({
  title,
  items,
  totalClicks,
}) => {
  return (
    <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
      <h3 className="font-display font-medium text-sm text-text-primary">{title}</h3>

      {items.length === 0 ? (
        <p className="text-xs text-text-faint py-4 text-center">No data available</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const percentage = totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100) : 0
            return (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-text-muted">
                  <span className="font-medium text-text-primary">{item.name || "Unknown"}</span>
                  <span className="font-mono">{formatNumber(item.clicks)} ({percentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
