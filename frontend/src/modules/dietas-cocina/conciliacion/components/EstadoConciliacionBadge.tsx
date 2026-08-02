import type { EstadoConciliacion } from "@/modules/dietas-cocina/types/enums"
import { estadoConciliacionConfig } from "@/modules/dietas-cocina/lib/estadosEstilos"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EstadoConciliacionBadgeProps {
  estado: EstadoConciliacion
  className?: string
}

export function EstadoConciliacionBadge({
  estado,
  className,
}: EstadoConciliacionBadgeProps) {
  const config = estadoConciliacionConfig[estado]
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  )
}
