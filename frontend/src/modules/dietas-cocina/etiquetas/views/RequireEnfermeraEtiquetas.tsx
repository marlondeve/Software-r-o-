import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import {
  usePuedeCapacidadEtiquetas,
  useTieneVistaOperativaBandejas,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"

interface RequireCapacidadEtiquetaProps {
  children: ReactNode
  capacidad?: CapacidadEtiquetas
  /** Cualquier flujo operativo de bandejas (no impresión proveedor). */
  operativa?: boolean
}

export function RequireCapacidadEtiqueta({
  children,
  capacidad,
  operativa = false,
}: RequireCapacidadEtiquetaProps) {
  const rol = useRolVistaEfectivo()
  const tieneOperativa = useTieneVistaOperativaBandejas(rol)
  const tieneCapacidad = usePuedeCapacidadEtiquetas(
    rol,
    capacidad ?? "recepcion_proveedor",
  )

  const permitido = operativa
    ? tieneOperativa
    : capacidad
      ? tieneCapacidad
      : false

  if (!permitido) {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  return children
}

/** @deprecated Usar RequireCapacidadEtiqueta con capacidad u operativa. */
export function RequireEnfermeraEtiquetas({
  children,
}: {
  children: ReactNode
}) {
  return (
    <RequireCapacidadEtiqueta operativa>{children}</RequireCapacidadEtiqueta>
  )
}
