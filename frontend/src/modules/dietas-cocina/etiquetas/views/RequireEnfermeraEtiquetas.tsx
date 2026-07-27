import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"

export function RequireEnfermeraEtiquetas({
  children,
}: {
  children: ReactNode
}) {
  const rol = useRolVistaEfectivo()

  if (rol !== "Enfermera") {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  return children
}
