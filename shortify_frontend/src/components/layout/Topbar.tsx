import React from "react"
import { useSearchParams, Link } from "react-router-dom"
import { LogOut, User as UserIcon, Plus, Link2, BarChart3, Settings, ChevronRight } from "lucide-react"
import { useAuthStore } from "../../store/auth.store"
import { ThemeToggle } from "../shared/ThemeToggle"
import { logoutUser } from "../../lib/api/auth"
import { toast } from "sonner"

interface TopbarProps {
  onCreateClick?: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ onCreateClick }) => {
  const { user, getRefreshToken, clearSession } = useAuthStore()
  const [searchParams] = useSearchParams()
  const currentTab = searchParams.get("tab") || "links"

  const handleLogout = async () => {
    const rf = getRefreshToken()
    if (rf) {
      try {
        await logoutUser(rf)
      } catch {
        // Clear session even if logout API fails
      }
    }
    clearSession()
    toast.success("Logged out successfully")
  }

  const breadcrumbMap: Record<string, string> = {
    links: "Links",
    analytics: "Analytics",
    settings: "Settings",
  }

  return (
    <header className="h-16 border-b border-border bg-surface/90 backdrop-blur-xl px-6 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Brand Title */}
        <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold">
            <Link2 className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold text-base text-text-primary">Shortify</span>
        </Link>

        {/* Clean Subtle Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className="text-text-faint font-medium">Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-faint/60" />
          <span className="text-text-primary font-medium capitalize">
            {breadcrumbMap[currentTab] || "Links"}
          </span>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex items-center gap-1 md:hidden text-xs">
        <Link
          to="/dashboard?tab=links"
          className={`p-2 rounded-md ${currentTab === "links" ? "text-accent bg-accent-soft" : "text-text-muted"}`}
          title="Links"
        >
          <Link2 className="w-4 h-4" />
        </Link>
        <Link
          to="/dashboard?tab=analytics"
          className={`p-2 rounded-md ${currentTab === "analytics" ? "text-accent bg-accent-soft" : "text-text-muted"}`}
          title="Analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </Link>
        <Link
          to="/dashboard?tab=settings"
          className={`p-2 rounded-md ${currentTab === "settings" ? "text-accent bg-accent-soft" : "text-text-muted"}`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle variant="icon" />

        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-md shadow-accent/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Link</span>
          </button>
        )}

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-medium text-xs">
              {user?.username?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-text-primary">{user?.username}</div>
              <div className="text-[10px] text-text-faint font-mono truncate max-w-[120px]">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-surface-raised text-text-muted hover:text-destructive transition-colors ml-1 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
