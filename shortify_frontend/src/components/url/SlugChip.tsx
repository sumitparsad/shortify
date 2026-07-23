import React, { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "../../lib/utils"

interface SlugChipProps {
  slug: string
  domain?: string
  fullUrl?: string
  className?: string
  showCopy?: boolean
  dimmed?: boolean
}

export const SlugChip: React.FC<SlugChipProps> = ({
  slug,
  domain = "shortify.to/",
  fullUrl,
  className,
  showCopy = true,
  dimmed = false,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const textToCopy = fullUrl || `${domain.replace(/\/$/, "")}/${slug}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback if clipboard API fails
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div
      onClick={showCopy ? handleCopy : undefined}
      className={cn(
        "inline-flex items-center gap-2 font-mono text-sm px-2.5 py-1 rounded-md border transition-all duration-150 select-none",
        "bg-surface-raised border-border",
        showCopy && "cursor-pointer hover:border-accent/40 hover:bg-surface-raised/80",
        dimmed && "opacity-60",
        className
      )}
      title={showCopy ? "Click to copy link" : undefined}
    >
      <div className="flex items-center overflow-hidden">
        <span className="text-text-faint font-normal">{domain}</span>
        <span className="text-text-primary font-medium">{slug}</span>
      </div>

      {showCopy && (
        <div className="flex items-center justify-center shrink-0 ml-0.5">
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success transition-transform scale-110" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-text-muted hover:text-text-primary transition-colors" />
          )}
        </div>
      )}
    </div>
  )
}
