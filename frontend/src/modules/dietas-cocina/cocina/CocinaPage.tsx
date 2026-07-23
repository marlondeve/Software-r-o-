import { SectionPage } from "@/components/shared/SectionPage"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { CocinaProveedorView } from "@/modules/dietas-cocina/cocina/views/CocinaProveedorView"
import { obtenerRolDietas } from "@/modules/dietas-cocina/lib/roles"

export function CocinaPage() {
  const { usuario } = useAuth()
  const rol = obtenerRolDietas(usuario)

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
