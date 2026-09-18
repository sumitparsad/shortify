import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { router } from "./router"
import { queryClient } from "./lib/queryClient"
import { useThemeStore, applyThemeToDocument } from "./store/theme.store"

export function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
      />
    </QueryClientProvider>
  )
}

export default App
