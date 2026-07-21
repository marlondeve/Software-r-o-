import { Navigate } from "react-router-dom"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    )
  }

  if (usuario) {
    return <Navigate to="/modulos" replace />
  }

  return children
}
