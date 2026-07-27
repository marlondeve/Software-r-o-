import { Outlet, useMatch } from "react-router-dom"

import { SectionPage } from "@/components/shared/SectionPage"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { EtiquetasProveedorView } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasProveedorView"

export function EtiquetasPage() {
  const rol = useRolVistaEfectivo()
  const esConsulta = useMatch("/dietas-cocina/etiquetas/consulta/:codigo")

  if (esConsulta) {
    return <Outlet />
  }

  if (rol === "Proveedor" || rol === "Administrador") {
    return <EtiquetasProveedorView />
  }

  if (rol === "Enfermera") {
    return <Outlet />
  }

  return (
    <SectionPage
      title="Etiquetas de dietas"
      description="Esta sección está disponible para el proveedor de cocina y el personal de enfermería."
    />
  )
}
