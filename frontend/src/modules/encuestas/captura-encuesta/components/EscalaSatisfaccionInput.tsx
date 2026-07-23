import { Angry, Frown, Laugh, Meh, Smile } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  OPCIONES_SATISFACCION,
  type ValorSatisfaccion,
} from "@/modules/encuestas/captura-encuesta/datos/mockCapturaEncuesta"

const ICONOS: Record<ValorSatisfaccion, LucideIcon> = {
  muy_satisfecho: Laugh,
  satisfecho: Smile,
  neutral: Meh,
  insatisfecho: Frown,
  muy_insatisfecho: Angry,
}

const TONO_POR_VALOR: Record<ValorSatisfaccion, "positivo" | "neutro" | "negativo"> = {
  muy_satisfecho: "positivo",
  satisfecho: "positivo",
  neutral: "neutro",
  insatisfecho: "negativo",
  muy_insatisfecho: "negativo",
}

const ESTILOS_TONO = {
  positivo: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  neutro: "border-amber-500 bg-amber-500/10 text-amber-600",
  negativo: "border-destructive bg-destructive/10 text-destructive",
}

interface EscalaSatisfaccionInputProps {
  value: ValorSatisfaccion | null
  onChange: (value: ValorSatisfaccion) => void
  disabled?: boolean
}

export function EscalaSatisfaccionInput({
  value,
  onChange,
  disabled,
}: EscalaSatisfaccionInputProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {OPCIONES_SATISFACCION.map((opcion) => {
        const Icon = ICONOS[opcion.valor]
        const seleccionado = value === opcion.valor
        const tono = TONO_POR_VALOR[opcion.valor]

        return (
          <button
            key={opcion.valor}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opcion.valor)}
            className={cn(
              "flex flex-col items-center gap-2.5 rounded-lg border border-border bg-card p-4 text-center text-foreground transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
              !seleccionado && "hover:bg-muted/40",
              seleccionado && ESTILOS_TONO[tono],
            )}
          >
            <Icon className="size-9" />
            <span className="text-sm font-medium">{opcion.label}</span>
          </button>
        )
      })}
    </div>
  )
}
