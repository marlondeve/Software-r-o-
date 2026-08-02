import type { EstadoDietaCatalogo } from "@/modules/dietas-cocina/types/enums"
import { estadoDietaCatalogoConfig } from "@/modules/dietas-cocina/lib/estadosEstilos"
import { Check, Clock, Power, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const ICONOS: Record<
  EstadoDietaCatalogo,
  typeof Check
> = {
  vigente: Check,
  programada: Clock,
  vencida: X,
  inactiva: Power,
}

interface EstadoDietaCatalogoBadgeProps {
  estado: EstadoDietaCatalogo
  className?: string
}

export function EstadoDietaCatalogoBadge({
  estado,
  className,
}: EstadoDietaCatalogoBadgeProps) {
  const config = estadoDietaCatalogoConfig[estado] ?? estadoDietaCatalogoConfig.vigente
  const Icon = ICONOS[estado] ?? Check
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", config.className, className)}>
      <Icon className="size-3" aria-hidden />
      {config.label}
    </Badge>
  )
}
