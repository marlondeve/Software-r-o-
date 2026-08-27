import { TruckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  TEXTO_ALERTA_SALIDA_CLINICA_SOSTENIDA,
  TOOLTIP_SALIDA_CLINICA_SOSTENIDA,
} from "@/modules/dietas-cocina/lib/labelEstadoOperativo"
import { cn } from "@/lib/utils"

interface SalidaClinicaSostenidaBadgeProps {
  /** Fila con salidaClinicaSostenida activo; si es false no se renderiza nada. */
  activo?: boolean
  className?: string
}

/**
 * El paciente egresó pasado el límite de novedades: la dieta no se cancela porque
 * cocina ya la produjo y el proveedor debe enviarla a la clínica.
 */
export function SalidaClinicaSostenidaBadge({
  activo,
  className,
}: SalidaClinicaSostenidaBadgeProps) {
  if (!activo) return null

  return (
    <Badge
      variant="outline"
      title={TOOLTIP_SALIDA_CLINICA_SOSTENIDA}
      className={cn(
        "gap-1 rounded-full border-amber-300 bg-amber-50 font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
        className,
      )}
    >
      <TruckIcon className="size-3" />
      {TEXTO_ALERTA_SALIDA_CLINICA_SOSTENIDA}
    </Badge>
  )
}
