import { Navigate } from "react-router-dom"

import { SeleccionModuloPage } from "@/features/autenticacion/components/SeleccionModuloPage"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerDestinoPostLogin } from "@/lib/modulos"

export function ModulosEntry() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  const destino = obtenerDestinoPostLogin(usuario)
  if (destino !== "/modulos") {
    return <Navigate to={destino} replace />
  }

  return <SeleccionModuloPage />
}
