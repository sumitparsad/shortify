import { apiClient } from "./client"
import type { URLCreate, URLListResponse, URLResponse, URLUpdate } from "../../types/url"
import type { APIResponse } from "../../types/auth"

export async function getUrls(params: { page?: number; size?: number } = {}): Promise<URLListResponse> {
  const page = params.page || 1
  const size = params.size || 20
  const response = await apiClient.get<URLListResponse>(`/urls/?page=${page}&size=${size}`)
  return response.data
}

export async function getUrlBySlug(slug: string): Promise<URLResponse> {
  const response = await apiClient.get<URLResponse>(`/urls/${slug}`)
  return response.data
}

export async function createUrl(data: URLCreate): Promise<URLResponse> {
  const response = await apiClient.post<URLResponse>("/urls/", data)
  return response.data
}

export async function updateUrl(slug: string, data: URLUpdate): Promise<URLResponse> {
  const response = await apiClient.patch<URLResponse>(`/urls/${slug}`, data)
  return response.data
}

export async function deleteUrl(slug: string): Promise<APIResponse> {
  const response = await apiClient.delete<APIResponse>(`/urls/${slug}`)
  return response.data
}
