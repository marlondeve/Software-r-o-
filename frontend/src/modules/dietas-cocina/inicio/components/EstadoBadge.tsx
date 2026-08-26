import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { claseBadgeEstadoDieta } from "@/modules/dietas-cocina/lib/estadosEstilos"
import { labelEstadoDietaVisible } from "@/modules/dietas-cocina/lib/labelEstadoOperativo"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EstadoBadgeProps {
  estado: EstadoDieta
  /** Observaciones de la fila: permite mostrar «Salida clínica». */
  observaciones?: string | null
  cancelacionPorSalidaClinica?: boolean
  /** Sobrescribe el texto del badge. */
  label?: string
  className?: string
}

export function EstadoBadge({
  estado,
  observaciones,
  cancelacionPorSalidaClinica,
  label,
  className,
}: EstadoBadgeProps) {
  const texto =
    label ??
    labelEstadoDietaVisible(estado, {
      observaciones,
      cancelacionPorSalidaClinica,
    })
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        claseBadgeEstadoDieta(estado),
        className,
      )}
    >
      {texto}
    </Badge>
  )
}
