import type { RolDietas } from "@/modules/dietas-cocina/types/enums"
import {
  Headphones,
  HeartPulse,
  Shield,
  Stethoscope,
  Truck,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { esRolDietas } from "@/modules/dietas-cocina/lib/roles"
import { rolDietasEstilos } from "@/modules/dietas-cocina/usuarios/lib/usuarioEstilos"
import { cn } from "@/lib/utils"

const ROL_ICONOS: Record<RolDietas, LucideIcon> = {
  Nutricionista: Stethoscope,
  Administrador: Headphones,
  Proveedor: Truck,
  Doctor: Stethoscope,
  Enfermera: HeartPulse,
}

interface UsuarioRolBadgeProps {
  rol: string
  className?: string
}

export function UsuarioRolBadge({ rol, className }: UsuarioRolBadgeProps) {
  const rolConocido = esRolDietas(rol)
  const Icon = rolConocido ? ROL_ICONOS[rol] : Shield
  const estilo = rolConocido
    ? rolDietasEstilos[rol]
    : { className: "border-border bg-muted/40 text-foreground" }

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", estilo.className, className)}
    >
      <Icon className="size-3" />
      {rol}
    </Badge>
  )
}
