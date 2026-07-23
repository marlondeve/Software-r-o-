import { Navigate } from "react-router-dom"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { EtiquetasEnfermeraView } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraView"
import { obtenerRolDietas } from "@/modules/dietas-cocina/lib/roles"

/** Índice de rutas enfermería bajo /etiquetas */
export function EtiquetasEnfermeraIndex() {
  const { usuario } = useAuth()
  const rol = obtenerRolDietas(usuario)

  if (rol !== "Enfermera") {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  return <EtiquetasEnfermeraView />
}
