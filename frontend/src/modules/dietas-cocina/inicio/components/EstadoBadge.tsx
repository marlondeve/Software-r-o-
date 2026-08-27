import { TruckIcon } from "lucide-react"

import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import {
  claseBadgeEstadoDietaVisible,
  esSalidaClinicaSostenida,
  labelEstadoDietaVisible,
  TOOLTIP_SALIDA_CLINICA_SOSTENIDA,
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
  const opciones = {
    observaciones,
    cancelacionPorSalidaClinica,
    salidaClinicaSostenida,
  }
  const texto = label ?? labelEstadoDietaVisible(estado, opciones)
  const asumeClinica = esSalidaClinicaSostenida({
    estado,
    salidaClinicaSostenida,
    observaciones,
  })

  return (
    <Badge
      variant="outline"
      title={asumeClinica ? TOOLTIP_SALIDA_CLINICA_SOSTENIDA : undefined}
      className={cn(
        "rounded-full font-medium",
        asumeClinica && "gap-1",
        claseBadgeEstadoDietaVisible(estado, opciones),
        className,
      )}
    >
      {asumeClinica ? <TruckIcon className="size-3 shrink-0" aria-hidden /> : null}
      {texto}
    </Badge>
  )
}
