import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EstadoConciliacion } from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"
import { badgeClassPorEstado } from "@/modules/dietas-cocina/conciliacion/lib/conciliacionEstilos"

const ESTADO_LABEL: Record<EstadoConciliacion, string> = {
  coincide: "Coincide",
  "dif-cantidad": "Dif. Cantidad",
  "dif-tarifa": "Dif. Tarifa",
  pendiente: "Pendiente",
  "conciliado-manual": "Conciliado Manual",
}

interface EstadoConciliacionBadgeProps {
  estado: EstadoConciliacion
  className?: string
}

export function EstadoConciliacionBadge({
  estado,
  className,
}: EstadoConciliacionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        badgeClassPorEstado(estado),
        className,
      )}
    >
      {ESTADO_LABEL[estado]}
    </Badge>
  )
}
