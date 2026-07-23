import React from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

interface AppShellProps {
  children: React.ReactNode
  onCreateClick?: () => void
}

export const AppShell: React.FC<AppShellProps> = ({ children, onCreateClick }) => {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-bg text-text-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar onCreateClick={onCreateClick} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-6xl w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
