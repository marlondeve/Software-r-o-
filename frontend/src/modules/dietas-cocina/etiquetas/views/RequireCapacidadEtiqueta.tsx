import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import {
  usePuedeCapacidadEtiquetas,
  useTieneVistaOperativaBandejas,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import { obtenerPrimeraRutaLogisticaPermitida } from "@/modules/dietas-cocina/lib/rutasLogistica"
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
    const destino =
      obtenerPrimeraRutaLogisticaPermitida(rol) ?? "/dietas-cocina/inicio"
    return <Navigate to={destino} replace />
  }

  return children
}
