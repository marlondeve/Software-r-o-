import type { EstadoUsuario } from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"
import { estadoUsuarioEstilos } from "@/modules/dietas-cocina/usuarios/lib/usuarioEstilos"
import { cn } from "@/lib/utils"

interface UsuarioEstadoBadgeProps {
  estado: EstadoUsuario
  className?: string
}

export function UsuarioEstadoBadge({ estado, className }: UsuarioEstadoBadgeProps) {
  const config = estadoUsuarioEstilos[estado]

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span
        className={cn("size-2 shrink-0 rounded-full", config.dotClassName)}
        aria-hidden
      />
      <span className="text-foreground">{config.label}</span>
    </span>
  )
}
