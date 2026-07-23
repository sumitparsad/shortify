import React, { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import {
  Link2,
  BarChart3,
  Clock,
  ArrowRight,
  QrCode,
  ChevronDown,
  Terminal,
  CheckCircle2,
  Zap,
  Layers,
  Globe,
  ShieldCheck,
  AlertCircle,
  Edit3,
} from "lucide-react"
import { useAuthStore } from "../store/auth.store"
import { SlugChip } from "../components/url/SlugChip"
import { ThemeToggle } from "../components/shared/ThemeToggle"
import { normalizeUrl, isValidWebAddress } from "../lib/validators/url.schema"

export const Landing: React.FC = () => {
  const { accessToken, getRefreshToken } = useAuthStore()
  const [inputUrl, setInputUrl] = useState("")
  const [customAlias, setCustomAlias] = useState("")
  const [useCustom, setUseCustom] = useState(false)
  const [isResolved, setIsResolved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"links" | "analytics" | "qr">("links")
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Redirect to dashboard if authenticated or has refresh token in localStorage
  const hasRefreshToken = !!getRefreshToken()
  if (accessToken || hasRefreshToken) {
    return <Navigate to="/dashboard" replace />
  }

  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!inputUrl.trim()) {
      setErrorMessage("Please enter a destination URL")
      return
    }

    if (!isValidWebAddress(inputUrl)) {
      setErrorMessage("Please enter a valid URL without spaces (e.g. google.com or github.com)")
      return
    }

    const formatted = normalizeUrl(inputUrl)
    setInputUrl(formatted)
    setIsResolved(true)
  }

  const generatedSlug = useCustom && customAlias.trim() ? customAlias.trim() : "x7Kq2p"

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col selection:bg-accent-soft selection:text-accent font-sans">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-accent/5 blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-border/60 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <Link2 className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-text-primary">
              Shortify
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-muted">
              v1.0
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a href="#demo" className="hover:text-text-primary transition-colors cursor-pointer">
              Shortener
            </a>
            <a href="#features" className="hover:text-text-primary transition-colors cursor-pointer">
              Features
            </a>
            <a href="#capabilities" className="hover:text-text-primary transition-colors cursor-pointer">
              Capabilities
            </a>
            <a href="#faq" className="hover:text-text-primary transition-colors cursor-pointer">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
            <Link
              to="/login"
              className="text-sm font-medium text-text-muted hover:text-text-primary px-3 py-1.5 transition-colors cursor-pointer"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white transition-all shadow-lg shadow-accent/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-16 pb-12 px-6 max-w-6xl mx-auto text-center relative">
          {/* Top Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-raised border border-border text-xs text-text-muted mb-8 shadow-inner animate-in fade-in slide-in-from-top-3 duration-500">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-text-primary font-medium">Smart Link Management</span>
            <span className="text-text-faint">•</span>
            <span className="text-text-muted">Global CDN Infrastructure</span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-text-primary leading-[1.08] max-w-4xl mx-auto">
            Shorten any link. <br />
            <span className="bg-gradient-to-r from-text-primary via-accent to-text-muted bg-clip-text text-transparent">
              Track every click in real time.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed font-sans">
            A high-performance URL shortening platform with global edge caching, custom domain aliases, and granular geolocation & device analytics.
          </p>

          {/* INTERACTIVE SHORTENER APP CONTAINER */}
          <div id="demo" className="mt-10 max-w-2xl mx-auto text-left scroll-mt-24">
            <div className="p-3 sm:p-4 bg-surface/90 border border-border/80 rounded-2xl shadow-2xl backdrop-blur-xl space-y-4">
              {/* CLEARLY SEGMENTED INTERACTIVE MODE TOGGLES */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
                <div className="flex items-center gap-1.5 bg-bg/80 border border-border p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustom(false)
                      setErrorMessage(null)
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      !useCustom
                        ? "bg-accent text-white shadow-sm font-semibold"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-raised"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto Short Slug</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustom(true)
                      setErrorMessage(null)
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      useCustom
                        ? "bg-accent text-white shadow-sm font-semibold"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-raised"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Custom Alias</span>
                  </button>
                </div>

                <span className="text-[11px] text-text-faint font-mono px-2 hidden sm:inline-block">
                  HTTPS • Sub-10ms Routing
                </span>
              </div>

              {!isResolved ? (
                <form noValidate onSubmit={handleShorten} className="space-y-3.5">
                  {/* Destination URL Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-muted">
                      Destination URL <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 p-1.5 bg-bg/90 border border-border rounded-xl focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 transition-all shadow-inner">
                      <input
                        type="url"
                        value={inputUrl}
                        onChange={(e) => {
                          setInputUrl(e.target.value)
                          if (errorMessage) setErrorMessage(null)
                        }}
                        placeholder="google.com or paste destination URL..."
                        className="flex-1 px-4 py-2.5 bg-transparent text-text-primary placeholder:text-text-faint text-sm focus:outline-none cursor-text"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98] flex items-center justify-center gap-2 group shrink-0 cursor-pointer"
                      >
                        <span>Shorten Link</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* CUSTOM ALIAS INPUT WITH CLEAR AFFORDANCE */}
                  {useCustom && (
                    <div className="space-y-1.5 animate-in fade-in duration-150">
                      <label className="block text-xs font-medium text-text-muted">
                        Custom Link Slug <span className="text-text-faint">(Optional)</span>
                      </label>
                      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-bg border border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 rounded-xl text-xs font-mono transition-all">
                        <span className="text-text-faint select-none font-semibold">shortify.to/</span>
                        <input
                          type="text"
                          value={customAlias}
                          onChange={(e) => setCustomAlias(e.target.value)}
                          placeholder="my-custom-alias"
                          className="flex-1 bg-transparent text-accent font-semibold focus:outline-none placeholder:text-text-faint cursor-text"
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Preview State */}
                  <div className="flex items-center justify-between px-2 pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-text-faint">Live Preview:</span>
                      <SlugChip slug={generatedSlug} dimmed showCopy={false} />
                    </div>
                    <span className="text-text-faint text-[11px]">Free tier: unlimited creation</span>
                  </div>
                </form>
              ) : (
                /* Resolved State Card */
                <div className="p-5 bg-bg/80 border border-border rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-xs text-success font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Link created successfully!</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsResolved(false)
                        setInputUrl("")
                        setCustomAlias("")
                      }}
                      className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      Shorten another
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-surface rounded-lg border border-border">
                    <div className="space-y-1">
                      <p className="text-[11px] text-text-faint truncate max-w-xs">{inputUrl}</p>
                      <SlugChip slug={generatedSlug} showCopy={true} />
                    </div>
                    <Link
                      to="/register"
                      className="px-3.5 py-1.5 text-xs rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white transition-all text-center shrink-0 font-medium cursor-pointer"
                    >
                      Claim & Track Link →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4 HERO METRIC CARDS */}
          <div className="mt-14 pt-8 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto text-left">
            {/* Metric 1 */}
            <div className="p-6 rounded-2xl bg-surface/70 border border-border/80 hover:border-accent/40 backdrop-blur-md shadow-lg transition-all group hover:-translate-y-1">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                Sub-10ms
              </div>
              <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed">
                Instant Edge Redirection
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-6 rounded-2xl bg-surface/70 border border-border/80 hover:border-accent/40 backdrop-blur-md shadow-lg transition-all group hover:-translate-y-1">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div className="font-display text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
                Custom Slugs
              </div>
              <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed">
                Branded & Unique Links
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-6 rounded-2xl bg-surface/70 border border-border/80 hover:border-accent/40 backdrop-blur-md shadow-lg transition-all group hover:-translate-y-1">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <div className="font-display text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
                Geo & Devices
              </div>
              <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed">
                Real-Time Traffic Insights
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-6 rounded-2xl bg-surface/70 border border-border/80 hover:border-accent/40 backdrop-blur-md shadow-lg transition-all group hover:-translate-y-1">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="font-display text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
                Encrypted
              </div>
              <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed">
                Account Security & Privacy
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SAAS PLATFORM SHOWCASE / MOCKUP WINDOW */}
        <section className="py-12 px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary">
              Built for speed. Designed for precision.
            </h2>
            <p className="text-sm text-text-muted">
              Inspect your link analytics, manage custom aliases, and generate instant QR codes from a clean unified workspace.
            </p>
          </div>

          {/* Window Frame Mockup */}
          <div className="rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
            {/* Top Mockup Header Bar */}
            <div className="px-4 py-3 bg-surface-raised border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
                <span className="ml-2 text-xs font-mono text-text-faint hidden sm:inline-block">
                  app.shortify.to/dashboard
                </span>
              </div>
              {/* Interactive Showcase Tabs */}
              <div className="flex items-center gap-1 bg-bg p-1 rounded-md border border-border text-xs">
                <button
                  onClick={() => setActiveTab("links")}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    activeTab === "links" ? "bg-surface-raised text-text-primary font-medium" : "text-text-muted"
                  }`}
                >
                  Link Manager
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    activeTab === "analytics" ? "bg-surface-raised text-accent font-medium" : "text-text-muted"
                  }`}
                >
                  Analytics Suite
                </button>
                <button
                  onClick={() => setActiveTab("qr")}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    activeTab === "qr" ? "bg-surface-raised text-text-primary font-medium" : "text-text-muted"
                  }`}
                >
                  QR Studio
                </button>
              </div>
            </div>

            {/* Tab 1: Links Manager Mockup */}
            {activeTab === "links" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">Showing 3 active links</span>
                  <button className="px-3 py-1.5 text-xs rounded bg-accent text-white font-medium flex items-center gap-1 cursor-pointer">
                    + New Link
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-bg border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">Launch Campaign 2026</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-text-faint truncate max-w-md">https://google.com</p>
                      <SlugChip slug="launch-2026" domain="shortify.to/" />
                    </div>
                    <div className="flex items-center gap-6 text-xs text-text-muted">
                      <div>
                        <div className="font-mono font-medium text-text-primary text-sm">1,420</div>
                        <div>Total Clicks</div>
                      </div>
                      <div>
                        <div className="font-mono font-medium text-text-primary text-sm">980</div>
                        <div>Unique Visitors</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-bg border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">Product Documentation</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                          Custom Alias
                        </span>
                      </div>
                      <p className="text-xs text-text-faint truncate max-w-md">https://docs.shortify.to/reference</p>
                      <SlugChip slug="docs-api" domain="shortify.to/" />
                    </div>
                    <div className="flex items-center gap-6 text-xs text-text-muted">
                      <div>
                        <div className="font-mono font-medium text-text-primary text-sm">840</div>
                        <div>Total Clicks</div>
                      </div>
                      <div>
                        <div className="font-mono font-medium text-text-primary text-sm">620</div>
                        <div>Unique Visitors</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Analytics Suite Mockup */}
            {activeTab === "analytics" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-bg border border-border">
                    <span className="text-xs text-text-muted">Total Clicks</span>
                    <div className="text-2xl font-mono font-semibold text-text-primary mt-1">2,260</div>
                    <span className="text-[11px] text-success font-medium">↑ +18% this week</span>
                  </div>
                  <div className="p-4 rounded-lg bg-bg border border-border">
                    <span className="text-xs text-text-muted">Unique Visitors</span>
                    <div className="text-2xl font-mono font-semibold text-text-primary mt-1">1,600</div>
                    <span className="text-[11px] text-accent font-medium">70.7% conversion</span>
                  </div>
                  <div className="p-4 rounded-lg bg-bg border border-border">
                    <span className="text-xs text-text-muted">Top Country</span>
                    <div className="text-2xl font-mono font-semibold text-text-primary mt-1">India (IN)</div>
                    <span className="text-[11px] text-text-muted">45% of overall traffic</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-bg border border-border space-y-3">
                    <span className="text-xs font-medium text-text-primary">Clicks by Browser</span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-text-muted mb-1">
                          <span>Chrome</span>
                          <span>1,400 clicks</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                          <div className="h-full bg-accent w-[65%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-text-muted mb-1">
                          <span>Safari</span>
                          <span>540 clicks</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                          <div className="h-full bg-accent/70 w-[25%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-bg border border-border space-y-3">
                    <span className="text-xs font-medium text-text-primary">Clicks by Device</span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-text-muted mb-1">
                          <span>Desktop</span>
                          <span>1,750 clicks</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                          <div className="h-full bg-accent w-[78%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-text-muted mb-1">
                          <span>Mobile</span>
                          <span>510 clicks</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                          <div className="h-full bg-accent/70 w-[22%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: QR Studio Mockup */}
            {activeTab === "qr" && (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 rounded-xl bg-white text-black shadow-lg">
                  <QrCode className="w-24 h-24" />
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-sm text-text-primary">shortify.to/launch-2026</div>
                  <p className="text-xs text-text-muted">High-resolution client-side vector QR code generator</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3-COLUMN FEATURE CARDS */}
        <section id="features" className="py-16 px-6 max-w-6xl mx-auto space-y-10 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              Engineered for modern link management.
            </h2>
            <p className="text-sm text-text-muted">
              Everything you need to manage short links, track performance metrics, and enforce link expiration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all space-y-4 shadow-lg group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-medium text-lg text-text-primary">Custom Aliases</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Brand your links with custom aliases (`shortify.to/my-brand`) or rely on compact auto-generated slugs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all space-y-4 shadow-lg group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-medium text-lg text-text-primary">Geographic & Device Insights</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Understand your audience with automated geolocation parsing, browser detection, and device classification.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all space-y-4 shadow-lg group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-medium text-lg text-text-primary">Expiration Governance</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Set strict expiration dates on temporary links or keep permanent redirects active indefinitely.
              </p>
            </div>
          </div>
        </section>

        {/* CAPABILITIES STRIP */}
        <section id="capabilities" className="py-16 px-6 max-w-6xl mx-auto border-t border-border/40 scroll-mt-20">
          <div className="bg-surface/50 border border-border rounded-xl p-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-accent">
              <Terminal className="w-4 h-4" />
              <span>Platform Capabilities</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-text-primary">
              Built for high-volume link redirection & analytics
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">Global CDN Redirection</span>
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">Sub-10ms Latency</span>
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">Real-Time Click Tracking</span>
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">Branded Custom Slugs</span>
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">Vector QR Code Generator</span>
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">Automated Link Expiration</span>
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">Bank-Grade Encryption</span>
              <span className="px-3.5 py-1.5 rounded-full bg-bg border border-border text-xs font-sans text-text-primary">99.99% Uptime Guarantee</span>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-16 px-6 max-w-4xl mx-auto space-y-8 scroll-mt-20">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-semibold text-text-primary">Frequently asked questions</h2>
            <p className="text-sm text-text-muted">Everything you need to know about link shortening, custom slugs, and analytics.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How fast is link redirection across the platform?",
                a: "Link redirection requests are processed at the global edge network before retrieving link metadata, providing near-instant redirection for your visitors.",
              },
              {
                q: "Can I specify custom domain aliases for my short links?",
                a: "Yes! You can specify a custom slug (e.g. shortify.to/my-brand) or let our system generate a compact 6-to-8 character unique slug automatically.",
              },
              {
                q: "Do I need to type 'https://' when creating a link?",
                a: "No! You can simply enter domain names like google.com or github.com, and Shortify will automatically format and normalize the target address.",
              },
              {
                q: "What happens when I deactivate a short link?",
                a: "Deactivating a link pauses public redirection while preserving all historical click statistics and analytics in your dashboard. You can reactivate the link anytime.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border/80 hover:border-accent/30 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left font-display font-medium text-base text-text-primary flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-raised/40 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0 transition-all duration-200 ${
                      openFaq === idx ? "bg-accent text-white border-accent rotate-180 shadow-md shadow-accent/25" : "bg-surface-raised text-text-muted"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-border/50 pt-4 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CLOSING GRADIENT CTA BOX */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <div className="p-10 rounded-2xl bg-gradient-to-b from-surface-raised via-surface to-bg border border-border text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-accent" />
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary">
              Put your links to work today.
            </h2>
            <p className="text-sm text-text-muted max-w-xl mx-auto">
              Create short links, monitor real-time click traffic, and analyze user geolocation analytics in seconds.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all shadow-xl shadow-accent/25 cursor-pointer"
              >
                <span>Create a free account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ULTRA-CLEAN 1-ROW MINIMAL SAAS FOOTER */}
      <footer className="border-t border-border/60 bg-surface/30 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold">
              <Link2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-semibold text-sm text-text-primary">Shortify</span>
            <span className="text-text-faint">•</span>
            <span className="text-text-faint text-[11px]">
              Built by <strong className="text-text-muted font-medium">Sumit Parsad</strong> © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised border border-border">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-text-primary font-medium">All Systems Operational</span>
            </div>
            <span className="text-text-faint">•</span>
            <span className="text-text-faint">Sub-10ms Latency</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
