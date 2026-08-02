import { Navigate } from "react-router-dom"

import { AuthLayoutSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerDestinoPostLogin } from "@/lib/modulos"

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <AuthLayoutSkeleton />
  }

  if (usuario) {
    return <Navigate to={obtenerDestinoPostLogin(usuario)} replace />
  }

  return children
}
