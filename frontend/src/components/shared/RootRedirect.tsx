import { Navigate } from "react-router-dom"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"

export function RootRedirect() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    )
  }

  return <Navigate to={usuario ? "/modulos" : "/login"} replace />
}
