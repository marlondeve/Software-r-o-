import type { ReactNode } from "react"
import { TriangleAlert } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { MOTIVOS_CALIFICACION_NEGATIVA } from "@/modules/encuestas/captura-encuesta/datos/mockCapturaEncuesta"

export interface MotivoCalificacion {
  chips: string[]
  texto: string
}

interface MotivoCalificacionPanelProps {
  motivo: MotivoCalificacion
  onChange: (motivo: MotivoCalificacion) => void
}

export function MotivoCalificacionPanel({
  motivo,
  onChange,
}: MotivoCalificacionPanelProps) {
  function toggleChip(chip: string) {
    const chips = motivo.chips.includes(chip)
      ? motivo.chips.filter((item) => item !== chip)
      : [...motivo.chips, chip]
    onChange({ ...motivo, chips })
  }

  return (
    <div className="space-y-4 rounded-lg bg-muted/50 p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-destructive">
        <TriangleAlert className="size-4" />
        Para continuar, registra el motivo de la calificación negativa.
      </p>

      <div className="space-y-2.5">
        <Label>Cuéntanos el motivo de esta calificación</Label>

        <div className="flex flex-wrap gap-2">
          {MOTIVOS_CALIFICACION_NEGATIVA.map((chip) => {
            const activo = motivo.chips.includes(chip)
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  activo
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {chip}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Textarea
            value={motivo.texto}
            onChange={(event) =>
              onChange({ ...motivo, texto: event.target.value.slice(0, 500) })
            }
            placeholder="Describe detalladamente la situación..."
            className="min-h-28 bg-card pb-6"
          />
          <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">
            {motivo.texto.length}/500
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Esta información nos ayuda a mejorar nuestros servicios de salud.
      </p>
    </div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-medium text-foreground">
      {children} <span className="text-destructive">*</span>
    </p>
  )
}
