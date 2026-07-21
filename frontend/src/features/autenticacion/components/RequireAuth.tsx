import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
