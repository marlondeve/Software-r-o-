import { SectionPage } from "@/components/shared/SectionPage"
import { CocinaProveedorView } from "@/modules/dietas-cocina/cocina/views/CocinaProveedorView"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"

export function CocinaPage() {
  const rol = useRolVistaEfectivo()

  if (rol === "Proveedor" || rol === "Administrador") {
    return <CocinaProveedorView />
  }

  return (
    <SectionPage
      title="Cocina y seguimiento"
      description="Esta sección está disponible para el proveedor de cocina y administradores."
    />
  )
}
