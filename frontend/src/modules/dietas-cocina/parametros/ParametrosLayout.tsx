import { Plus } from "lucide-react"
import { Outlet, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ParametrosSubNav } from "@/modules/dietas-cocina/parametros/components/ParametrosSubNav"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { obtenerSeccionParametros } from "@/modules/dietas-cocina/parametros/lib/parametrosNav"

export function ParametrosLayout() {
  const { pathname } = useLocation()
  const seccion = obtenerSeccionParametros(pathname)

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title={seccion.titulo}
        subtitle={seccion.descripcion}
        actions={
          seccion.id === "tipos-paciente" ? (
            <Button type="button">
              <Plus className="size-4" />
              Crear nueva categoría
            </Button>
          ) : undefined
        }
      />

      <ParametrosSubNav />

      <Outlet />
    </div>
  )
}
