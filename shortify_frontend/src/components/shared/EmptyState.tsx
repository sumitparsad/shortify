import React from "react"
import { Link2 } from "lucide-react"

interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No short links found",
  description = "Get started by creating your first shortened URL link.",
  action,
  icon,
}) => {
  return (
    <div className="p-12 text-center border border-border rounded-xl bg-surface/40 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-faint">
        {icon || <Link2 className="w-6 h-6" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-display font-medium text-lg text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
