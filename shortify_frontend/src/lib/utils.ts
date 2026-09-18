import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function isExpired(expiresAt: string | null | undefined): boolean {
  return expiresAt ? new Date(expiresAt) < new Date() : false
}

/** A link redirects only when it is switched on AND not past its expiry. */
export function isLinkLive(url: { is_active: boolean; expires_at: string | null }): boolean {
  return url.is_active && !isExpired(url.expires_at)
}

/** Formats an ISO date for a `datetime-local` input in the user's local timezone. */
export function toDateTimeLocalValue(dateString: string): string {
  const date = new Date(dateString)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(num)
}
