import { apiClient } from "./client"
import type { TopURLResponse, URLAnalyticsResponse } from "../../types/analytics"

export async function getUrlAnalytics(slug: string): Promise<URLAnalyticsResponse> {
  const response = await apiClient.get<URLAnalyticsResponse>(`/analytics/${slug}`)
  return response.data
}

export async function getTopUrls(limit = 10): Promise<TopURLResponse[]> {
  const response = await apiClient.get<TopURLResponse[]>(`/analytics/top/urls?limit=${limit}`)
  return response.data
}
