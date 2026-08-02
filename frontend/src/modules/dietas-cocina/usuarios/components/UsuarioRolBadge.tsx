import { Shield, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { esRolAdministrador } from "@/modules/dietas-cocina/lib/roles"
import { ROL_BADGE_DEFAULT } from "@/modules/dietas-cocina/usuarios/lib/usuarioEstilos"
import { cn } from "@/lib/utils"

interface UsuarioRolBadgeProps {
  rol: string
  className?: string
}

function iconoRol(rol: string): LucideIcon {
  if (esRolAdministrador(rol)) return Shield
  return Shield
}

export function UsuarioRolBadge({ rol, className }: UsuarioRolBadgeProps) {
  const Icon = iconoRol(rol)

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        ROL_BADGE_DEFAULT.className,
        className,
      )}
    >
      <Icon className="size-3" />
      {rol}
    </Badge>
  )
}
