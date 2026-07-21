import { useEffect } from "react"

import { Navigate } from "react-router-dom"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { guardarModuloActivo } from "@/lib/modulos"
import type { ModuloId } from "@/tipos/modulo"

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!usuario.accesos.some((acceso) => acceso.moduloId === moduloId)) {
    return <Navigate to="/modulos" replace />
  }

  return children
}
