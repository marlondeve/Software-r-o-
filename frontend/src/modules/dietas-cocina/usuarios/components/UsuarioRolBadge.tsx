import {
  Headphones,
  HeartPulse,
  Stethoscope,
  Truck,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
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
  rol: RolDietas
  className?: string
}

export function UsuarioRolBadge({ rol, className }: UsuarioRolBadgeProps) {
  const Icon = ROL_ICONOS[rol]
  const estilo = rolDietasEstilos[rol]

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
