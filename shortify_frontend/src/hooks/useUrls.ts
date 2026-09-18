import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getUrls, createUrl, updateUrl, deleteUrl } from "../lib/api/urls"
import { extractErrorMessage } from "../lib/api/client"
import type { URLCreate, URLListResponse, URLUpdate } from "../types/url"

export function useUrls(page = 1, size = 20) {
  return useQuery<URLListResponse, Error>({
    queryKey: ["urls", page, size],
    queryFn: () => getUrls({ page, size }),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useCreateUrl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: URLCreate) => createUrl(data),
    onSuccess: (newUrl) => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      queryClient.invalidateQueries({ queryKey: ["top-urls"] })
      toast.success(`Short link created: ${newUrl.short_url}`)
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err))
    },
  })
}

export function useUpdateUrl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: URLUpdate }) => updateUrl(slug, data),
    onSuccess: (updatedUrl, { data }) => {
      // Update cache in-place so inactive links do NOT vanish from the user's dashboard UI!
      queryClient.setQueriesData({ queryKey: ["urls"] }, (oldData: URLListResponse | undefined) => {
        if (!oldData) return oldData
        const exists = oldData.items.some((item) => item.slug === updatedUrl.slug)
        const updatedItems = exists
          ? oldData.items.map((item) => (item.slug === updatedUrl.slug ? updatedUrl : item))
          : [updatedUrl, ...oldData.items]
        return {
          ...oldData,
          items: updatedItems,
        }
      })
      queryClient.invalidateQueries({ queryKey: ["url", updatedUrl.slug] })
      queryClient.invalidateQueries({ queryKey: ["top-urls"] })
      const isStatusToggle = Object.keys(data).length === 1 && "is_active" in data
      if (isStatusToggle) {
        toast.success(updatedUrl.is_active ? "Link activated" : "Link deactivated")
      } else {
        toast.success("Link updated")
      }
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err))
    },
  })
}

export function useDeleteUrl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (slug: string) => deleteUrl(slug),
    onSuccess: (_, deletedSlug) => {
      // Remove deleted item from cache
      queryClient.setQueriesData({ queryKey: ["urls"] }, (oldData: URLListResponse | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          items: oldData.items.filter((item) => item.slug !== deletedSlug),
          total: Math.max(0, oldData.total - 1),
        }
      })
      queryClient.removeQueries({ queryKey: ["url", deletedSlug] })
      queryClient.removeQueries({ queryKey: ["analytics", deletedSlug] })
      queryClient.invalidateQueries({ queryKey: ["top-urls"] })
      toast.success("Link deleted successfully")
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err))
    },
  })
}
