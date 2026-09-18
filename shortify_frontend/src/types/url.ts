export interface URLResponse {
  id: string
  slug: string
  long_url: string
  title: string | null
  short_url: string
  is_active: boolean
  is_custom_alias: boolean
  click_count: number
  expires_at: string | null
  created_at: string
  updated_at: string
  owner_id: string
}

export interface URLCreate {
  long_url: string
  custom_alias?: string
  title?: string
  expires_at?: string
}

export interface URLUpdate {
  long_url?: string
  title?: string | null // null clears the title
  expires_at?: string | null // null removes the expiry
  is_active?: boolean
}

export interface URLListResponse {
  items: URLResponse[]
  total: number
  page: number
  size: number
  pages: number
}
