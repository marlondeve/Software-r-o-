import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerRolDietas } from "@/modules/dietas-cocina/lib/roles"

export function RequireEnfermeraEtiquetas({
  children,
}: {
  children: ReactNode
}) {
  const { usuario } = useAuth()
  const rol = obtenerRolDietas(usuario)

  if (rol !== "Enfermera") {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  return children
}
