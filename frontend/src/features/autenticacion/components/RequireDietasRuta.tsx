import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { puedeAccederRuta } from "@/modules/dietas-cocina/lib/permisos"
import { obtenerRolDietas } from "@/modules/dietas-cocina/lib/roles"

export function RequireDietasRuta() {
  const { usuario } = useAuth()
  const location = useLocation()
  const rol = obtenerRolDietas(usuario)

  if (!puedeAccederRuta(rol, location.pathname)) {
    return <Navigate to="/dietas-cocina/inicio" replace />
  }

  return <Outlet />
}
