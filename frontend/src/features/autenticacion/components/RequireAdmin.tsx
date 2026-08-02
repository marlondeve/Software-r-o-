import { Navigate } from "react-router-dom"

import { AuthLayoutSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { usuarioEsAdministrador, obtenerDestinoPostLogin } from "@/lib/modulos"

interface RequireAdminProps {
  children: React.ReactNode
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <AuthLayoutSkeleton />
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!usuarioEsAdministrador(usuario)) {
    return <Navigate to={obtenerDestinoPostLogin(usuario)} replace />
  }

  return children
}
