import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"
import { ReportesNutricionistaView } from "@/modules/dietas-cocina/reportes/views/ReportesNutricionistaView"

export function ReportesClinicosPage() {
  return (
    <RutaDietasSectionGuard
      segmento="reportes-clinicos"
      title="Reportes clínicos"
    >
      <ReportesNutricionistaView />
    </RutaDietasSectionGuard>
  )
}
