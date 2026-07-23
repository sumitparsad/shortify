import React from "react"
import { Link } from "react-router-dom"
import { Link2, ArrowLeft, Zap, ShieldCheck, Globe, Layers } from "lucide-react"
import { LoginForm } from "../components/auth/LoginForm"
import { ThemeToggle } from "../components/shared/ThemeToggle"

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row text-text-primary selection:bg-accent-soft selection:text-accent font-sans">
      {/* LEFT SIDE: BRAND SHOWCASE PANEL */}
      <div className="w-full md:w-1/2 p-8 lg:p-12 bg-surface/50 border-r border-border flex flex-col justify-between relative overflow-hidden hidden md:flex">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors font-bold">
              <Link2 className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-text-primary">
              Shortify
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-muted">
              v1.0
            </span>
          </Link>
        </div>

        {/* Middle Value Proposition */}
        <div className="space-y-6 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/20 text-xs text-accent font-medium">
            <Zap className="w-3.5 h-3.5" />
            <span>Fast Link Redirection</span>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-text-primary leading-tight">
            Shorten links. <br />
            Track performance with precision.
          </h2>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <div className="w-6 h-6 rounded-md bg-surface border border-border text-accent flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <span>Fast global edge cache redirection for all your short links</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <div className="w-6 h-6 rounded-md bg-surface border border-border text-accent flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span>Branded custom domain slugs & high-resolution vector QR code export</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <div className="w-6 h-6 rounded-md bg-surface border border-border text-accent flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Link expiration controls and real-time click analytics</span>
            </div>
          </div>
        </div>

        {/* Bottom Credit */}
        <div className="text-xs text-text-faint">
          Built by <strong className="text-text-muted font-medium">Sumit Parsad</strong> © {new Date().getFullYear()}
        </div>
      </div>

      {/* RIGHT SIDE: AUTH FORM CONTAINER */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 max-w-lg mx-auto w-full">
        {/* UNIFIED TOP NAVIGATION BAR */}
        <div className="flex items-center justify-between w-full pb-4 border-b border-border/40">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
          </div>
        </div>

        {/* Main Form Content */}
        <div className="my-auto py-8 space-y-6 w-full">
          <div className="space-y-1 text-left">
            <h1 className="font-display text-2xl font-semibold text-text-primary">Welcome back</h1>
            <p className="text-xs text-text-muted">Sign in to your Shortify account to manage your links.</p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border shadow-xl space-y-4">
            <LoginForm />
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-text-faint">
          Secure encrypted authentication
        </div>
      </div>
    </div>
  )
}
