import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"
import { CocinaProveedorView } from "@/modules/dietas-cocina/cocina/views/CocinaProveedorView"

export function CocinaPage() {
  return (
    <RutaDietasSectionGuard
      segmento="cocina"
      title="Cocina y seguimiento"
      description="No tiene permisos para esta sección. Si su rol opera bandejas en planta, use la sección Etiquetas."
    >
      <CocinaProveedorView />
    </RutaDietasSectionGuard>
  )
}
