import { createBrowserRouter } from "react-router-dom"
import { Landing } from "./pages/Landing"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Dashboard } from "./pages/Dashboard"
import { LinkDetail } from "./pages/LinkDetail"
import { NotFound } from "./pages/NotFound"
import { AuthGuard } from "./components/auth/AuthGuard"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/links/:slug",
    element: (
      <AuthGuard>
        <LinkDetail />
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
