import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"
import { ReportesProveedorView } from "@/modules/dietas-cocina/reportes/views/ReportesProveedorView"

export function ReportesProduccionPage() {
  return (
    <RutaDietasSectionGuard
      segmento="reportes-produccion"
      title="Reportes de producción"
    >
      <ReportesProveedorView />
    </RutaDietasSectionGuard>
  )
}
