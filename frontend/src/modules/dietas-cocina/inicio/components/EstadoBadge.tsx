import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { estadoDietaConfig } from "@/modules/dietas-cocina/lib/estadosEstilos"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EstadoBadgeProps {
  estado: EstadoDieta
  className?: string
}

export function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  const config = estadoDietaConfig[estado]
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
