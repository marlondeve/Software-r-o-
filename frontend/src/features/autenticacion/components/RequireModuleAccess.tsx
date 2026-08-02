import { useEffect } from "react"

import { Navigate } from "react-router-dom"

import { AuthLayoutSkeleton } from "@/components/shared/skeletons"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { guardarModuloActivo, obtenerDestinoPostLogin } from "@/lib/modulos"
import { moduloHabilitado } from "@/lib/modulosFlags"
import type { ModuloId } from "@/types/module"

interface RequireModuleAccessProps {
  moduloId: ModuloId
  children: React.ReactNode
}

export function RequireModuleAccess({
  moduloId,
  children,
}: RequireModuleAccessProps) {
  const { usuario, cargando } = useAuth()

  useEffect(() => {
    if (usuario && usuario.accesos.some((a) => a.moduloId === moduloId)) {
      guardarModuloActivo(moduloId)
    }
  }, [usuario, moduloId])

  if (cargando) {
    return <AuthLayoutSkeleton />
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!moduloHabilitado(moduloId)) {
    return <Navigate to={obtenerDestinoPostLogin(usuario)} replace />
  }

  if (!usuario.accesos.some((acceso) => acceso.moduloId === moduloId)) {
    return <Navigate to={obtenerDestinoPostLogin(usuario)} replace />
  }

  return children
}
