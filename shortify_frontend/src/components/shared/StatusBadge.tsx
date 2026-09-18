import React from "react"
import { cn, isExpired } from "../../lib/utils"

interface StatusBadgeProps {
  isActive: boolean
  expiresAt?: string | null
  isCustomAlias?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  expiresAt,
  isCustomAlias,
  className,
}) => {
  const expired = isExpired(expiresAt)

  if (!isActive || expired) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-destructive/10 border-destructive/20 text-destructive",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
        <span>{expired ? "Expired" : "Inactive"}</span>
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-success/10 border-success/20 text-success",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span>Active</span>
      </span>

      {isCustomAlias && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border bg-warning/10 border-warning/20 text-warning">
          Custom
        </span>
      )}
    </div>
  )
}
