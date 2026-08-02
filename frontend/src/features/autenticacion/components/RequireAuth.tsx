import { Navigate, useLocation } from "react-router-dom"

import { AuthLayoutSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return <AuthLayoutSkeleton />
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
