import { Outlet, useMatch } from "react-router-dom"

import { SectionPage } from "@/components/shared/SectionPage"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { EtiquetasProveedorView } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasProveedorView"
import { obtenerRolDietas } from "@/modules/dietas-cocina/lib/roles"

export function EtiquetasPage() {
  const { usuario } = useAuth()
  const rol = obtenerRolDietas(usuario)
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
