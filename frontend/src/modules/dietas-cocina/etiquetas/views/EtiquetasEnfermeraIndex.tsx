import { Navigate } from "react-router-dom"

import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { tieneVistaOperativaBandejas } from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import { EtiquetasEnfermeraView } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraView"

export function EtiquetasEnfermeraIndex() {
  const rol = useRolVistaEfectivo()

  if (!tieneVistaOperativaBandejas(rol)) {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  return <EtiquetasEnfermeraView />
}
