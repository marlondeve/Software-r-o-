import type { ReactNode } from "react"
import { Navigate, useParams } from "react-router-dom"

import { parseTipoDevolucionParam } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import { RequireCapacidadEtiqueta } from "@/modules/dietas-cocina/etiquetas/views/RequireCapacidadEtiqueta"
import { RUTAS_LOGISTICA } from "@/modules/dietas-cocina/lib/rutasLogistica"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"

function capacidadDevolucion(tipo: string | undefined): CapacidadEtiquetas | null {
  const parsed = parseTipoDevolucionParam(tipo)
  if (parsed === "antes_entrega") return "rechazo_antes_entrega"
  if (parsed === "post_entrega") return "recogida_bandeja"
  return null
}

export function RequireDevolucionEtiqueta({ children }: { children: ReactNode }) {
  const { tipo } = useParams<{ tipo: string }>()
  const capacidad = capacidadDevolucion(tipo)

  if (!capacidad) {
    return <Navigate to={RUTAS_LOGISTICA.piso} replace />
  }

  return (
    <RequireCapacidadEtiqueta capacidad={capacidad}>{children}</RequireCapacidadEtiqueta>
  )
}
