import { Navigate } from "react-router-dom"

import { AuthLayoutSkeleton } from "@/components/shared/skeletons"
import { SeleccionModuloPage } from "@/features/autenticacion/components/SeleccionModuloPage"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerDestinoPostLogin } from "@/lib/modulos"

export function ModulosEntry() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <AuthLayoutSkeleton />
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
