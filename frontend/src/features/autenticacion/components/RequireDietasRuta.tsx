import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { puedeAccederRuta } from "@/modules/dietas-cocina/lib/permisos"

export function RequireDietasRuta() {
  const location = useLocation()
  const rol = useRolVistaEfectivo()

  if (!puedeAccederRuta(rol, location.pathname)) {
    return <Navigate to="/dietas-cocina/inicio" replace />
  }

  return <Outlet />
}
