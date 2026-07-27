import type { RolDietas } from "@/modules/dietas-cocina/types/enums"
import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import { permisosPorRolDesdeApi } from "@/modules/dietas-cocina/usuarios/lib/permisosApiBridge"
import { cn } from "@/lib/utils"

interface PermisosRolResumenProps {
  rol: RolDietas
  className?: string
  permisosApi?: PermisoRolDto[]
}

export function PermisosRolResumen({
  rol,
  className,
  permisosApi,
}: PermisosRolResumenProps) {
  const { config } = useConfigAccesoModulos()
  const rutas = permisosApi
    ? permisosPorRolDesdeApi(permisosApi, rol)
    : config.permisosDietas[rol] ?? []
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
