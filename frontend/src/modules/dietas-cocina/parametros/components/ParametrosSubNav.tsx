import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"
import { SECCIONES_PARAMETROS } from "@/modules/dietas-cocina/parametros/lib/parametrosNav"

export function ParametrosSubNav() {
  return (
    <nav
      aria-label="Secciones de parámetros"
      className="flex flex-wrap gap-1 rounded-lg bg-muted p-1"
    >
      {SECCIONES_PARAMETROS.map((seccion) => (
        <NavLink
          key={seccion.id}
          to={seccion.path}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          {seccion.label}
        </NavLink>
      ))}
    </nav>
  )
}
