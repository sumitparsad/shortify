import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ThemeMode = "system" | "light" | "dark"

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  getEffectiveTheme: () => "light" | "dark"
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme: ThemeMode) => {
        set({ theme })
        applyThemeToDocument(theme)
      },
      getEffectiveTheme: () => {
        const theme = get().theme
        if (theme === "system") {
          return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        }
        return theme
      },
    }),
    {
      name: "shortify-theme",
    }
  )
)

export function applyThemeToDocument(theme: ThemeMode) {
  const root = document.documentElement
  let isDark = false

  if (theme === "system") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  } else {
    isDark = theme === "dark"
  }

  if (isDark) {
    root.classList.add("dark")
    root.classList.remove("light")
    root.style.colorScheme = "dark"
  } else {
    root.classList.add("light")
    root.classList.remove("dark")
    root.style.colorScheme = "light"
  }
}

// Initial listener for OS system theme changes
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const currentTheme = useThemeStore.getState().theme
    if (currentTheme === "system") {
      applyThemeToDocument("system")
    }
  })
}
