import { SectionPage } from "@/components/shared/SectionPage"
import { RutaDietasSectionGuard } from "@/modules/dietas-cocina/components/RutaDietasSectionGuard"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { EnfermeraDashboard } from "@/modules/dietas-cocina/inicio/dashboards/EnfermeraDashboard"
import { NutricionistaDashboard } from "@/modules/dietas-cocina/inicio/dashboards/NutricionistaDashboard"
import { ProveedorDashboard } from "@/modules/dietas-cocina/inicio/dashboards/ProveedorDashboard"
import { tieneAccesoClinicoDietas, esRolAdministracionModulo, tieneAccesoLogisticaBandejas, rutaDietasPermitida, tieneAccesoReportesProduccion } from "@/modules/dietas-cocina/lib/permisos"
import { useMatrizPermisosVersion } from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import {
  puedeRecepcionProveedor,
  tieneOperacionBandejasPiso,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"

function InicioPageContent() {
  const rol = useRolVistaEfectivo()
  useMatrizPermisosVersion()

  if (tieneAccesoClinicoDietas(rol) || esRolAdministracionModulo(rol)) {
    return <NutricionistaDashboard />
  }

  if (rutaDietasPermitida(rol, "cocina")) {
    return <ProveedorDashboard />
  }

  if (
    puedeRecepcionProveedor(rol) ||
    tieneOperacionBandejasPiso(rol) ||
    tieneAccesoLogisticaBandejas(rol)
  ) {
    return <EnfermeraDashboard />
  }

  if (tieneAccesoReportesProduccion(rol)) {
    return <ProveedorDashboard />
  }

  return (
    <SectionPage
      title="Inicio"
      description="No hay un panel configurado para los permisos de su rol."
    />
  )
}

export function InicioPage() {
  return (
    <RutaDietasSectionGuard segmento="inicio" title="Inicio">
      <InicioPageContent />
    </RutaDietasSectionGuard>
  )
}
