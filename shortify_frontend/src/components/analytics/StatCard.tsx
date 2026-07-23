import React from "react"
import { formatNumber } from "../../lib/utils"

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{title}</span>
        {icon && <div className="text-accent">{icon}</div>}
      </div>
      <div className="font-mono text-2xl font-semibold text-text-primary tracking-tight">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
      {subtitle && <p className="text-[11px] text-text-faint">{subtitle}</p>}
    </div>
  )
}
