import { Check } from "lucide-react"

import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  indicePasoActivoSeguimiento,
  PASOS_SEGUIMIENTO,
} from "@/modules/dietas-cocina/cocina/lib/cocinaSeguimiento"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { cn } from "@/lib/utils"

interface CocinaSeguimientoTimelineProps {
  orden: OrdenCocina
  etiqueta?: EtiquetaEnfermera
}

export function CocinaSeguimientoTimeline({
  orden,
  etiqueta,
}: CocinaSeguimientoTimelineProps) {
  const activo = indicePasoActivoSeguimiento(orden, etiqueta)

  return (
    <ul className="space-y-0">
      {PASOS_SEGUIMIENTO.map((paso, index) => {
        const completado = index < activo
        const esActivo = index === activo
        const esUltimo = index === PASOS_SEGUIMIENTO.length - 1

        return (
          <li key={paso.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  completado
                    ? "border-primary bg-primary text-primary-foreground"
                    : esActivo
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground",
                )}
              >
                {completado ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              {!esUltimo && (
                <span
                  className={cn(
                    "my-1 w-0.5 flex-1 min-h-6",
                    completado ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-5 pt-0.5", esUltimo && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  esActivo || completado
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {paso.label}
              </p>
              {esActivo && (
                <p className="text-xs text-primary">Paso actual</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
