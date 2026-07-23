export interface ClicksByDate {
  date: string
  clicks: number
}

export interface ClicksByCountry {
  country_code: string | null
  clicks: number
}

export interface ClicksByBrowser {
  browser: string | null
  clicks: number
}

export interface ClicksByOS {
  os: string | null
  clicks: number
}

export interface ClicksByDevice {
  device_type: string | null
  clicks: number
}

export interface URLAnalyticsResponse {
  slug: string
  total_clicks: number
  unique_visitors: number
  clicks_by_date: ClicksByDate[]
  clicks_by_country: ClicksByCountry[]
  clicks_by_browser: ClicksByBrowser[]
  clicks_by_os: ClicksByOS[]
  clicks_by_device: ClicksByDevice[]
}

export interface TopURLResponse {
  slug: string
  long_url: string
  title: string | null
  click_count: number
  short_url: string
}
