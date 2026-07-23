import React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Link2, BarChart3, Settings, ShieldCheck } from "lucide-react"
import { cn } from "../../lib/utils"

export const Sidebar: React.FC = () => {
  const [searchParams] = useSearchParams()
  const currentTab = searchParams.get("tab") || "links"

  const navItems = [
    { label: "My Links", id: "links", path: "/dashboard?tab=links", icon: Link2 },
    { label: "Analytics", id: "analytics", path: "/dashboard?tab=analytics", icon: BarChart3 },
    { label: "Settings", id: "settings", path: "/dashboard?tab=settings", icon: Settings },
  ]

  return (
    <aside className="w-64 border-r border-border bg-surface/50 h-screen shrink-0 flex flex-col justify-between p-4 hidden md:flex">
      <div className="space-y-6">
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold">
            <Link2 className="w-4.5 h-4.5" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-text-primary">
            Shortify
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-muted">
            v1.0
          </span>
        </Link>

        {/* Sidebar Navigation */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-mono font-medium text-text-faint uppercase tracking-wider">
            Dashboard
          </span>
          <nav className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id || (item.id === "links" && currentTab === "links")
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-accent-soft text-accent border border-accent/30 shadow-sm"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-raised"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-3.5 rounded-xl bg-surface-raised/80 border border-border/70 space-y-1.5 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-text-primary font-medium text-xs">Systems Operational</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-faint">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Global Edge Active</span>
        </div>
      </div>
    </aside>
  )
}
