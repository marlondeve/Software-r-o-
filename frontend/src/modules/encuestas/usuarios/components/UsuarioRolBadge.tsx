import { Shield, UserPlus, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { RolEncuestas } from "@/modules/encuestas/lib/roles"
import { cn } from "@/lib/utils"

const ROL_ICONOS: Record<RolEncuestas, LucideIcon> = {
  Administrador: Shield,
  Encuestador: UserPlus,
}

const ROL_ESTILOS: Record<RolEncuestas, string> = {
  Administrador: "bg-muted text-muted-foreground border-border",
  Encuestador: "bg-primary/10 text-primary border-primary/20",
}

interface UsuarioRolBadgeProps {
  rol: RolEncuestas
  className?: string
}

export function UsuarioRolBadge({ rol, className }: UsuarioRolBadgeProps) {
  const Icon = ROL_ICONOS[rol]

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", ROL_ESTILOS[rol], className)}
    >
      <Icon className="size-3" />
      {rol}
    </Badge>
  )
}
