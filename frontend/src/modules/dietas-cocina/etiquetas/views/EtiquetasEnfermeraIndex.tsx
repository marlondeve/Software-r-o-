import { Navigate } from "react-router-dom"

import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { EtiquetasEnfermeraView } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraView"

/** Índice de rutas enfermería bajo /etiquetas */
export function EtiquetasEnfermeraIndex() {
  const rol = useRolVistaEfectivo()

  if (rol !== "Enfermera") {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  return <EtiquetasEnfermeraView />
}
