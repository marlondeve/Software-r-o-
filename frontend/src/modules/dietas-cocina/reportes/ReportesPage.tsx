import { SectionPage } from "@/components/shared/SectionPage"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import {
  comparteDashboardNutricion,
  obtenerRolDietas,
} from "@/modules/dietas-cocina/lib/roles"
import { ReportesNutricionistaView } from "@/modules/dietas-cocina/reportes/views/ReportesNutricionistaView"
import { ReportesProveedorView } from "@/modules/dietas-cocina/reportes/views/ReportesProveedorView"

export function ReportesPage() {
  const { usuario } = useAuth()
  const rol = obtenerRolDietas(usuario)

  if (comparteDashboardNutricion(rol)) {
    return <ReportesNutricionistaView />
  }

  if (rol === "Proveedor") {
    return <ReportesProveedorView />
  }

  return (
    <SectionPage
      title="Reportes"
      description="No tienes acceso a reportes para tu rol."
    />
  )
}
