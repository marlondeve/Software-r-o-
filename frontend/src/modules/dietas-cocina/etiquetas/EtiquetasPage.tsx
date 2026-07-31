import { Outlet, useMatch } from "react-router-dom"

import { SectionPage } from "@/components/shared/SectionPage"
import { useRolVistaEfectivo, useVistaRolAdmin } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import {
  tieneVistaImpresionEtiquetas,
  tieneVistaOperativaBandejas,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import { EtiquetasProveedorView } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasProveedorView"

export function EtiquetasPage() {
  const rol = useRolVistaEfectivo()
  const { esAdminReal, vistaPreviewActiva } = useVistaRolAdmin()
  const esIndex = useMatch({ path: "/dietas-cocina/etiquetas", end: true })
  const esConsulta = useMatch("/dietas-cocina/etiquetas/consulta/:codigo")
  const esSubrutaOperativa = useMatch({
    path: "/dietas-cocina/etiquetas/:subruta/*",
    end: false,
  })

  const tieneImpresion = tieneVistaImpresionEtiquetas(rol)
  const tieneOperaciones = tieneVistaOperativaBandejas(rol)
  const subruta = esSubrutaOperativa?.params.subruta
  const enFlujoOperativo =
    !!esConsulta ||
    subruta === "pre-entrega" ||
    subruta === "entrega" ||
    subruta === "devolucion" ||
    subruta === "exito"

  if (enFlujoOperativo) {
    return <Outlet />
  }

  if (esIndex && esAdminReal && !vistaPreviewActiva && tieneImpresion) {
    return <EtiquetasProveedorView />
  }

  if (tieneOperaciones) {
    return <Outlet />
  }

  if (tieneImpresion) {
    return <EtiquetasProveedorView />
  }

  return (
    <SectionPage
      title="Etiquetas de dietas"
      description="Esta sección está disponible para el proveedor de cocina o para roles con permisos de recepción, entrega y recogida de bandejas."
    />
  )
}
