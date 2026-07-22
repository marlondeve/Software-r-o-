import { CircleCheck, Mic, Phone, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { PacienteContextoEncuesta } from "@/modules/encuestas/captura-encuesta/datos/mockCapturaEncuesta"

interface CapturaEncuestaTopBarProps {
  paciente: PacienteContextoEncuesta
  onSalir: () => void
}

export function CapturaEncuestaTopBar({ paciente, onSalir }: CapturaEncuestaTopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
      <div className="flex flex-wrap items-center gap-6">
        <span className="text-xl font-bold text-primary">Bital</span>

        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Paciente
          </p>
          <p className="text-sm font-medium text-foreground">
            {paciente.nombre} ({paciente.documento})
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Contexto
          </p>
          <p className="text-sm font-medium text-foreground">
            {paciente.eps} - {paciente.servicio}
          </p>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-border bg-muted font-normal text-foreground"
        >
          {paciente.canal === "telefonica" ? (
            <Phone className="size-3.5" />
          ) : (
            <Mic className="size-3.5" />
          )}
          {paciente.canal === "telefonica" ? "Captura Telefónica" : "Captura Presencial"}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <CircleCheck className="size-4" />
          Guardado automáticamente
        </span>
        <button
          type="button"
          onClick={onSalir}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-destructive"
        >
          <X className="size-4" />
          Salir
        </button>
      </div>
    </header>
  )
}
