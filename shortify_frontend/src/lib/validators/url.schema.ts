import { z } from "zod"

/**
 * Smart URL Normalizer & Strict Validator
 * Handles:
 * - "wer wer.com" -> INVALID (contains internal whitespace, returns false)
 * - "google" -> INVALID (no TLD/dot, returns false)
 * - "google.com" -> "https://google.com"
 * - "www.google.com/search?q=1" -> "https://www.google.com/search?q=1"
 * - "http://site.org" -> "http://site.org"
 * - "https://site.org" -> "https://site.org"
 */
export function normalizeUrl(url: string): string {
  let trimmed = url.trim()
  if (!trimmed) return ""

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export function isValidWebAddress(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false

  // URLs cannot contain internal whitespace
  if (/\s/.test(trimmed)) {
    return false
  }

  // Must contain a TLD (dot followed by 2+ characters) or be localhost
  const isLocalhost = /^localhost(:\d+)?(\/.*)?$/i.test(trimmed) || /^https?:\/\/localhost(:\d+)?(\/.*)?$/i.test(trimmed)
  
  // TLD pattern: must have a dot followed by at least 2 letters (e.g. .com, .org, .io, .co, .dev, .app, .in)
  const hasValidTld = /\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)

  if (!isLocalhost && !hasValidTld) {
    return false
  }

  const normalized = normalizeUrl(trimmed)
  try {
    const parsed = new URL(normalized)
    const validProtocol = parsed.protocol === "http:" || parsed.protocol === "https:"
    const validHost = isLocalhost || parsed.hostname.includes(".")
    return validProtocol && validHost
  } catch {
    return false
  }
}

export const CreateUrlSchema = z.object({
  long_url: z
    .string()
    .min(1, "Please enter a web address (e.g. google.com)")
    .refine((val) => isValidWebAddress(val), {
      message: "Please enter a valid URL without spaces (e.g. google.com or github.com)",
    }),
  custom_alias: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 3 && val.length <= 50), {
      message: "Custom alias must be between 3 and 50 characters",
    })
    .refine((val) => !val || /^[a-zA-Z0-9_-]+$/.test(val), {
      message: "Custom alias can only contain letters, numbers, underscores, and hyphens",
    }),
  title: z.string().max(255, "Title must be at most 255 characters").optional(),
  has_expiry: z.boolean().optional(),
  expires_at: z.string().optional(),
})

export type CreateUrlFormData = z.infer<typeof CreateUrlSchema>

export const UpdateUrlSchema = z.object({
  long_url: z
    .string()
    .optional()
    .refine((val) => !val || isValidWebAddress(val), {
      message: "Please enter a valid URL without spaces (e.g. google.com or github.com)",
    }),
  title: z.string().max(255, "Title must be at most 255 characters").optional(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

export type UpdateUrlFormData = z.infer<typeof UpdateUrlSchema>
