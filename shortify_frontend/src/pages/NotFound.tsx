import React from "react"
import { Link } from "react-router-dom"

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 text-center">
      <h1 className="font-display text-6xl font-semibold text-text-primary mb-2">404</h1>
      <p className="text-text-muted text-sm mb-6">Page not found</p>
      <Link
        to="/"
        className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
      >
        Go back home
      </Link>
    </div>
  )
}
