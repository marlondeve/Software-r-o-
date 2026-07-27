import { SectionPage } from "@/components/shared/SectionPage"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { EnfermeraDashboard } from "@/modules/dietas-cocina/inicio/dashboards/EnfermeraDashboard"
import { NutricionistaDashboard } from "@/modules/dietas-cocina/inicio/dashboards/NutricionistaDashboard"
import { ProveedorDashboard } from "@/modules/dietas-cocina/inicio/dashboards/ProveedorDashboard"
import { comparteDashboardNutricion } from "@/modules/dietas-cocina/lib/roles"

export function InicioPage() {
  const rol = useRolVistaEfectivo()

  if (comparteDashboardNutricion(rol)) {
    return <NutricionistaDashboard />
  }

  if (rol === "Proveedor") {
    return <ProveedorDashboard />
  }

  if (rol === "Enfermera") {
    return <EnfermeraDashboard />
  }

  return (
    <SectionPage
      title="Inicio"
      description="Rol no reconocido para este módulo."
    />
  )
}
