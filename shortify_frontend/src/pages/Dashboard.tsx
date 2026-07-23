import React, { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Shield, Globe, User as UserIcon, Link2, MousePointer, Activity, Zap } from "lucide-react"
import { AppShell } from "../components/layout/AppShell"
import { UrlList } from "../components/url/UrlList"
import { CreateUrlDialog } from "../components/url/CreateUrlDialog"
import { EditUrlDialog } from "../components/url/EditUrlDialog"
import { DeleteUrlAlert } from "../components/url/DeleteUrlAlert"
import { StatCard } from "../components/analytics/StatCard"
import { SlugChip } from "../components/url/SlugChip"
import { ThemeToggle } from "../components/shared/ThemeToggle"
import { useUrls } from "../hooks/useUrls"
import { useTopUrls } from "../hooks/useUrlAnalytics"
import { useAuthStore } from "../store/auth.store"
import { extractErrorMessage } from "../lib/api/client"
import { formatNumber } from "../lib/utils"
import type { URLResponse } from "../types/url"

export const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams()
  const currentTab = searchParams.get("tab") || "links"

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUrl, setEditingUrl] = useState<URLResponse | null>(null)
  const [deletingUrl, setDeletingUrl] = useState<URLResponse | null>(null)

  const { user } = useAuthStore()
  const { data, isLoading, isError, error } = useUrls(page, pageSize)
  const { data: topUrls, isLoading: isTopLoading } = useTopUrls(10)

  const handleSelectUrl = (url: URLResponse) => {
    window.location.href = `/links/${url.slug}`
  }

  const shortDomain = import.meta.env.VITE_SHORT_URL_BASE
    ? `${import.meta.env.VITE_SHORT_URL_BASE.replace(/^https?:\/\//, "")}/`
    : `${window.location.host}/`

  // Calculate total clicks sum for active page items
  const totalClicksSum = data?.items.reduce((acc, curr) => acc + (curr.click_count || 0), 0) || 0
  const activeLinksCount = data?.items.filter((item) => item.is_active).length || 0

  return (
    <AppShell onCreateClick={() => setIsCreateOpen(true)}>
      <div className="space-y-6">
        {/* VIEW 1: MY LINKS */}
        {currentTab === "links" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
              <div>
                <h2 className="font-display font-semibold text-xl text-text-primary">Short Links</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Create, edit, and track your active short URLs with real-time analytics.
                </p>
              </div>
            </div>

            {/* DASHBOARD TOP METRIC STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Total Short Links</div>
                  <div className="font-mono text-xl font-semibold text-text-primary mt-0.5">
                    {formatNumber(data?.total || 0)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                  <MousePointer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Page Clicks Volume</div>
                  <div className="font-mono text-xl font-semibold text-text-primary mt-0.5">
                    {formatNumber(totalClicksSum)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 text-success flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Active Links</div>
                  <div className="font-mono text-xl font-semibold text-text-primary mt-0.5">
                    {activeLinksCount} <span className="text-xs font-sans text-text-faint">of {data?.items.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Global CDN Redirection</div>
                  <div className="font-mono text-sm font-semibold text-success mt-1">
                    Sub-10ms Latency
                  </div>
                </div>
              </div>
            </div>

            <UrlList
              items={data?.items || []}
              total={data?.total || 0}
              page={data?.page || page}
              pages={data?.pages || 1}
              isLoading={isLoading}
              isError={isError}
              errorMessage={error ? extractErrorMessage(error) : undefined}
              onPageChange={(newPage) => setPage(newPage)}
              onSelectUrl={handleSelectUrl}
              onEditUrl={(url) => setEditingUrl(url)}
              onDeleteUrl={(url) => setDeletingUrl(url)}
              onCreateClick={() => setIsCreateOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2: ANALYTICS */}
        {currentTab === "analytics" && (
          <div className="space-y-6 text-left animate-in fade-in duration-150">
            <div className="pb-2 border-b border-border/40">
              <h2 className="font-display font-semibold text-xl text-text-primary">Global Traffic Analytics</h2>
              <p className="text-xs text-text-muted mt-0.5">Performance summary across all your active short links.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Links" value={data?.total || 0} subtitle="Active shortened URLs" />
              <StatCard
                title="Top Performing Link"
                value={topUrls?.[0]?.slug ? topUrls[0].slug : "None"}
                subtitle={topUrls?.[0] ? `${topUrls[0].click_count} total clicks` : "No clicks recorded"}
              />
              <StatCard
                title="System Status"
                value="Operational"
                subtitle="Global Edge CDN Active"
              />
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-medium text-sm text-text-primary">Top Links Leaderboard</h3>
                <span className="text-xs text-text-faint">By Click Count</span>
              </div>

              {isTopLoading ? (
                <div className="py-8 text-center text-xs text-text-faint">Loading top links...</div>
              ) : !topUrls || topUrls.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-faint">No link traffic recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {topUrls.map((item, idx) => (
                    <div
                      key={item.slug}
                      onClick={() => (window.location.href = `/links/${item.slug}`)}
                      className="p-3.5 rounded-lg bg-bg border border-border hover:border-accent/40 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-accent">#{idx + 1}</span>
                          <span className="text-sm font-medium text-text-primary truncate">
                            {item.title || item.slug}
                          </span>
                        </div>
                        <SlugChip slug={item.slug} domain={shortDomain} fullUrl={item.short_url} />
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-semibold text-text-primary">
                          {item.click_count}
                        </div>
                        <div className="text-[11px] text-text-faint">clicks</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: SETTINGS */}
        {currentTab === "settings" && (
          <div className="space-y-6 text-left max-w-2xl animate-in fade-in duration-150">
            <div className="pb-2 border-b border-border/40">
              <h2 className="font-display font-semibold text-xl text-text-primary">Account & Profile Settings</h2>
              <p className="text-xs text-text-muted mt-0.5">Manage your account profile and connection settings.</p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center text-lg font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-display font-medium text-base text-text-primary">{user?.username}</h3>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Account ID</span>
                  <span className="font-mono text-text-faint">{user?.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Role</span>
                  <span className="font-mono px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent/20">
                    {user?.role || "user"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-text-muted">Account Status</span>
                  <span className="text-success font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-text-muted">Security</span>
                  <span className="flex items-center gap-1 text-text-primary">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span>Secure Session</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Appearance & Theme Settings */}
            <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-medium text-sm text-text-primary">Interface Theme</h3>
                  <p className="text-xs text-text-muted">Choose your preferred workspace theme (System, Light, or Dark).</p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <h3 className="font-display font-medium text-sm text-text-primary">API Endpoint</h3>
              </div>
              <p className="text-xs text-text-muted">
                Connected to the edge network for instant link redirection.
              </p>
              <div className="p-3 rounded-md bg-bg border border-border font-mono text-xs text-text-faint">
                {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Modals */}
      <CreateUrlDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EditUrlDialog url={editingUrl} isOpen={!!editingUrl} onClose={() => setEditingUrl(null)} />
      <DeleteUrlAlert url={deletingUrl} isOpen={!!deletingUrl} onClose={() => setDeletingUrl(null)} />
    </AppShell>
  )
}
