import { Navigate } from "react-router-dom"

import { AuthLayoutSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerDestinoPostLogin } from "@/lib/modulos"

export function RootRedirect() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <AuthLayoutSkeleton />
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={obtenerDestinoPostLogin(usuario)} replace />
}
