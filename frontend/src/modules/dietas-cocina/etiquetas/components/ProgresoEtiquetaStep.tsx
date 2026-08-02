import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  ETIQUETAS_PASOS_FLUJO,
  ETIQUETAS_TOTAL_PASOS_FLUJO,
} from "@/modules/dietas-cocina/etiquetas/lib/flujosEtiquetaSteps"

interface ProgresoEtiquetaStepProps {
  paso: number
  total?: number
  pasos?: readonly string[]
}

export function ProgresoEtiquetaStep({
  paso,
  total = ETIQUETAS_TOTAL_PASOS_FLUJO,
  pasos = ETIQUETAS_PASOS_FLUJO,
}: ProgresoEtiquetaStepProps) {
  const pasoActual = Math.min(Math.max(paso, 1), total)
  const etiquetas = pasos.slice(0, total)

  return (
    <div className="flex items-start justify-between gap-2">
        {etiquetas.map((etiqueta, indice) => {
          const numero = indice + 1
          const completado = numero < pasoActual
          const activo = numero === pasoActual

          return (
            <div
              key={etiqueta}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex w-full items-center">
                {indice > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      completado || activo ? "bg-primary" : "bg-muted",
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    completado &&
                      "border-primary bg-primary text-primary-foreground",
                    activo && "border-primary bg-primary/10 text-primary",
                    !completado &&
                      !activo &&
                      "border-muted-foreground/25 bg-background text-muted-foreground",
                  )}
                  aria-current={activo ? "step" : undefined}
                >
                  {completado ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    numero
                  )}
                </span>
                {indice < etiquetas.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      completado ? "bg-primary" : "bg-muted",
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <span
                className={cn(
                  "max-w-22 truncate text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-xs",
                  activo ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {etiqueta}
              </span>
            </div>
          )
        })}
    </div>
  )
}
