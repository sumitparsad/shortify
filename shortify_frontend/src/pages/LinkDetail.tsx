import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ExternalLink, MousePointer, Users, Globe, Smartphone, Edit2, Trash2 } from "lucide-react"
import { AppShell } from "../components/layout/AppShell"
import { SlugChip } from "../components/url/SlugChip"
import { StatusBadge } from "../components/shared/StatusBadge"
import { StatCard } from "../components/analytics/StatCard"
import { ClicksTrendChart } from "../components/analytics/ClicksTrendChart"
import { BreakdownBarChart } from "../components/analytics/BreakdownBarChart"
import { AnalyticsSkeleton } from "../components/analytics/AnalyticsSkeleton"
import { EditUrlDialog } from "../components/url/EditUrlDialog"
import { DeleteUrlAlert } from "../components/url/DeleteUrlAlert"
import { QrCodeButton } from "../components/url/QrCodeButton"
import { useUrlAnalytics } from "../hooks/useUrlAnalytics"
import { useQuery } from "@tanstack/react-query"
import { getUrlBySlug } from "../lib/api/urls"
import { extractErrorMessage } from "../lib/api/client"
import { EmptyState } from "../components/shared/EmptyState"

export const LinkDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Fetch URL metadata
  const { data: urlData, isLoading: isUrlLoading, isError: isUrlError, error: urlError } = useQuery({
    queryKey: ["url", slug],
    queryFn: () => getUrlBySlug(slug || ""),
    enabled: !!slug,
  })

  // Fetch Analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useUrlAnalytics(slug || "")

  const isLoading = isUrlLoading || isAnalyticsLoading
  // short_url is the source of truth — comes directly from the API response

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to links</span>
        </button>

        {isUrlError ? (
          <EmptyState
            title="Link not found"
            description={extractErrorMessage(urlError)}
            action={
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
              >
                Back to links
              </button>
            }
          />
        ) : isLoading || !urlData ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            {/* Header Card */}
            <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-semibold text-xl text-text-primary">
                      {urlData.title || urlData.slug}
                    </h1>
                    <StatusBadge
                      isActive={urlData.is_active}
                      expiresAt={urlData.expires_at}
                      isCustomAlias={urlData.is_custom_alias}
                    />
                  </div>
                  <a
                    href={urlData.long_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors truncate max-w-xl"
                  >
                    <span className="truncate">{urlData.long_url}</span>
                    <ExternalLink className="w-3 h-3 text-text-faint shrink-0" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <QrCodeButton url={urlData.short_url} slug={urlData.slug} />

                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-3 py-1.5 rounded-md border border-border bg-surface-raised hover:bg-surface-raised/80 text-text-muted hover:text-text-primary text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="px-3 py-1.5 rounded-md border border-destructive/20 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <SlugChip fullUrl={urlData.short_url} />
              </div>
            </div>

            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Clicks"
                value={analytics?.total_clicks || urlData.click_count}
                subtitle="Overall click count"
                icon={<MousePointer className="w-4 h-4 text-accent" />}
              />
              <StatCard
                title="Unique Visitors"
                value={analytics?.unique_visitors || 0}
                subtitle="Distinct IP addresses"
                icon={<Users className="w-4 h-4 text-accent" />}
              />
              <StatCard
                title="Top Country"
                value={analytics?.clicks_by_country[0]?.country_code || "N/A"}
                subtitle="Highest click region"
                icon={<Globe className="w-4 h-4 text-accent" />}
              />
              <StatCard
                title="Primary Device"
                value={analytics?.clicks_by_device[0]?.device_type || "N/A"}
                subtitle="Most active platform"
                icon={<Smartphone className="w-4 h-4 text-accent" />}
              />
            </div>

            {/* Clicks Trend Chart */}
            <ClicksTrendChart data={analytics?.clicks_by_date || []} />

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BreakdownBarChart
                title="Clicks by Country"
                items={(analytics?.clicks_by_country || []).map((c) => ({
                  name: c.country_code || "Unknown",
                  clicks: c.clicks,
                }))}
                totalClicks={analytics?.total_clicks || 0}
              />
              <BreakdownBarChart
                title="Clicks by Browser"
                items={(analytics?.clicks_by_browser || []).map((b) => ({
                  name: b.browser || "Unknown",
                  clicks: b.clicks,
                }))}
                totalClicks={analytics?.total_clicks || 0}
              />
              <BreakdownBarChart
                title="Clicks by Operating System"
                items={(analytics?.clicks_by_os || []).map((o) => ({
                  name: o.os || "Unknown",
                  clicks: o.clicks,
                }))}
                totalClicks={analytics?.total_clicks || 0}
              />
              <BreakdownBarChart
                title="Clicks by Device Type"
                items={(analytics?.clicks_by_device || []).map((d) => ({
                  name: d.device_type || "Unknown",
                  clicks: d.clicks,
                }))}
                totalClicks={analytics?.total_clicks || 0}
              />
            </div>

            {/* Dialogs */}
            <EditUrlDialog
              url={urlData}
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
            />
            <DeleteUrlAlert
              url={urlData}
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              onDeleted={() => navigate("/dashboard")}
            />
          </>
        )}
      </div>
    </AppShell>
  )
}
