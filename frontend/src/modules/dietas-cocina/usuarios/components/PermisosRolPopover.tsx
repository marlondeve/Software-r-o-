import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import { permisosPorRolDesdeApi } from "@/modules/dietas-cocina/usuarios/lib/permisosApiBridge"
import { cn } from "@/lib/utils"

interface PermisosRolResumenProps {
  rol: string
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
  const etiquetas = rutas.map(
    (id) => RUTAS_DIETAS.find((ruta) => ruta.id === id)?.label ?? id,
  )

  if (etiquetas.length === 0) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Sin secciones asignadas
      </span>
    )
  }

  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-muted-foreground wrap-break-word",
        className,
      )}
    >
      {etiquetas.join(" · ")}
    </p>
  )
}
