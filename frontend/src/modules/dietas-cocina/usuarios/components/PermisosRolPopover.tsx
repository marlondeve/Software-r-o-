import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import { cn } from "@/lib/utils"

interface PermisosRolResumenProps {
  rol: RolDietas
  className?: string
}

export function PermisosRolResumen({ rol, className }: PermisosRolResumenProps) {
  const { config } = useConfigAccesoModulos()
  const rutas = config.permisosDietas[rol] ?? []
  const etiquetas = rutas
    .map(
      (id) => RUTAS_DIETAS.find((ruta) => ruta.id === id)?.label ?? id,
    )
    .join(", ")

  return (
    <span className={cn("text-muted-foreground", className)}>
      {etiquetas || "Sin secciones asignadas"}
    </span>
  )
}
