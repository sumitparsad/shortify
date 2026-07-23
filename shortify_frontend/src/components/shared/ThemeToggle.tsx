import React, { useState, useRef, useEffect } from "react"
import { Sun, Moon, Monitor, ChevronDown, Check } from "lucide-react"
import { useThemeStore, applyThemeToDocument, type ThemeMode } from "../../store/theme.store"

interface ThemeToggleProps {
  variant?: "default" | "icon"
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = "default" }) => {
  const { theme, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const options: Array<{ id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: "system", label: "System", icon: Monitor },
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ]

  const activeOption = options.find((opt) => opt.id === theme) || options[0]
  const ActiveIcon = activeOption.icon

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {variant === "icon" ? (
        /* Sleek Compact Icon Button */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-lg bg-surface border border-border/80 hover:border-accent/40 text-text-primary flex items-center justify-center transition-all cursor-pointer hover:bg-surface-raised active:scale-[0.98]"
          title={`Theme: ${activeOption.label}`}
        >
          <ActiveIcon className="w-4 h-4 text-accent" />
        </button>
      ) : (
        /* Default Button with Text Label */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 rounded-lg bg-surface border border-border/80 text-text-primary hover:border-accent/40 text-xs font-medium transition-all flex items-center gap-2 cursor-pointer hover:bg-surface-raised active:scale-[0.98]"
          title="Theme Selector"
        >
          <ActiveIcon className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="capitalize">{activeOption.label}</span>
          <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* Synchronized Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-surface/95 border border-border/80 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5 backdrop-blur-xl">
          {options.map((opt) => {
            const Icon = opt.icon
            const isSelected = theme === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "text-accent font-semibold bg-accent-soft"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
