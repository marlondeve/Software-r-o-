import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import {
  claseBadgeEstadoDietaVisible,
  labelEstadoDietaVisible,
} from "@/modules/dietas-cocina/lib/labelEstadoOperativo"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EstadoBadgeProps {
  estado: EstadoDieta
  /** Observaciones de la fila: permite mostrar «Salida clínica». */
  observaciones?: string | null
  cancelacionPorSalidaClinica?: boolean
  salidaClinicaSostenida?: boolean
  /** Sobrescribe el texto del badge. */
  label?: string
  className?: string
}

export function EstadoBadge({
  estado,
  observaciones,
  cancelacionPorSalidaClinica,
  salidaClinicaSostenida,
  label,
  className,
}: EstadoBadgeProps) {
  const texto =
    label ??
    labelEstadoDietaVisible(estado, {
      observaciones,
      cancelacionPorSalidaClinica,
      salidaClinicaSostenida,
    })
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        claseBadgeEstadoDietaVisible(estado, {
          observaciones,
          cancelacionPorSalidaClinica,
        }),
        className,
      )}
    >
      {texto}
    </Badge>
  )
}
