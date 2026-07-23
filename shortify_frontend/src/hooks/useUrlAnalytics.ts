import { useQuery } from "@tanstack/react-query"
import { getUrlAnalytics, getTopUrls } from "../lib/api/analytics"
import type { TopURLResponse, URLAnalyticsResponse } from "../types/analytics"

export function useUrlAnalytics(slug: string) {
  return useQuery<URLAnalyticsResponse, Error>({
    queryKey: ["analytics", slug],
    queryFn: () => getUrlAnalytics(slug),
    enabled: !!slug,
    staleTime: 1000 * 15, // 15 seconds
  })
}

export function useTopUrls(limit = 10) {
  return useQuery<TopURLResponse[], Error>({
    queryKey: ["top-urls", limit],
    queryFn: () => getTopUrls(limit),
    staleTime: 1000 * 60, // 1 minute
  })
}
