import { Navigate, Outlet, useLocation } from "react-router-dom"

import { SectionPageSkeleton } from "@/components/shared/skeletons"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { puedeAccederRuta } from "@/modules/dietas-cocina/lib/permisos"
import {
  obtenerMatrizPermisosApi,
  useMatrizPermisosVersion,
} from "@/modules/dietas-cocina/lib/permisosMatrizCache"

export function RequireDietasRuta() {
  const location = useLocation()
  const rol = useRolVistaEfectivo()
  useMatrizPermisosVersion()
  const apiActiva = usarApiDietasCocina()
  const matriz = obtenerMatrizPermisosApi()

  if (apiActiva && matriz === null) {
    return (
      <div className="py-8">
        <SectionPageSkeleton />
      </div>
    )
  }

  if (!puedeAccederRuta(rol, location.pathname)) {
    return <Navigate to="/dietas-cocina/inicio" replace />
  }

  return <Outlet />
}
