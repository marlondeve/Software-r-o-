import type { EstadoUsuarioEncuestas } from "@/modules/encuestas/usuarios/datos/mockUsuarios"
import { cn } from "@/lib/utils"

const ESTADO_CONFIG: Record<EstadoUsuarioEncuestas, { label: string; dotClassName: string }> = {
  activo: { label: "Activo", dotClassName: "bg-emerald-500" },
  inactivo: { label: "Inactivo", dotClassName: "bg-muted-foreground" },
}

interface UsuarioEstadoBadgeProps {
  estado: EstadoUsuarioEncuestas
  className?: string
}

export function UsuarioEstadoBadge({ estado, className }: UsuarioEstadoBadgeProps) {
  const config = ESTADO_CONFIG[estado]

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span className={cn("size-2 shrink-0 rounded-full", config.dotClassName)} aria-hidden />
      <span className="text-foreground">{config.label}</span>
    </span>
  )
}
