import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"
import { EtiquetasProveedorView } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasProveedorView"

export function ImpresionEtiquetasPage() {
  return (
    <RutaDietasSectionGuard
      segmento="impresion-etiquetas"
      title="Impresión de etiquetas"
    >
      <EtiquetasProveedorView />
    </RutaDietasSectionGuard>
  )
}
