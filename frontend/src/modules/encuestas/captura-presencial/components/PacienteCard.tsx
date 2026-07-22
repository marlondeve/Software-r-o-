import {
  BedDouble,
  CircleAlert,
  CircleX,
  ClipboardPlus,
  CloudCheck,
  DoorOpen,
  Eye,
  Hospital,
  IdCard,
  Play,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InfoChip } from "@/modules/encuestas/captura-presencial/components/InfoChip"
import { PacienteEstadoBadge } from "@/modules/encuestas/captura-presencial/components/PacienteEstadoBadge"
import type { PacientePresencial } from "@/modules/encuestas/captura-presencial/datos/mockCapturaPresencial"
import { cn } from "@/lib/utils"

interface PacienteCardProps {
  paciente: PacientePresencial
  onIniciar: (paciente: PacientePresencial) => void
  onContinuar: (paciente: PacientePresencial) => void
  onVer: (paciente: PacientePresencial) => void
  onMarcarNoDisponible: (paciente: PacientePresencial) => void
  onRechazar: (paciente: PacientePresencial) => void
  onReintentar: (paciente: PacientePresencial) => void
}

export function PacienteCard({
  paciente,
  onIniciar,
  onContinuar,
  onVer,
  onMarcarNoDisponible,
  onRechazar,
  onReintentar,
}: PacienteCardProps) {
  const enProceso = paciente.estado === "en_proceso"
  const inactiva = paciente.estado === "completada" || paciente.estado === "no_disponible"

  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden py-0 shadow-none",
        enProceso && "ring-1 ring-primary/40",
      )}
    >
      {enProceso && <div className="h-1 w-full bg-accent" />}

      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className={cn(
                "text-base font-semibold text-foreground",
                inactiva && "text-muted-foreground",
              )}
            >
              {paciente.nombre}
            </h3>
            <PacienteEstadoBadge estado={paciente.estado} />
          </div>

          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <IdCard className="size-3.5" />
            ID: {paciente.documento}
          </p>

          <div className="flex flex-wrap gap-2">
            <InfoChip icon={Hospital} variant="servicio">
              {paciente.servicio}
            </InfoChip>
            <InfoChip icon={DoorOpen}>{paciente.ubicacion}</InfoChip>
            {paciente.aseguradora && <InfoChip>{paciente.aseguradora}</InfoChip>}
          </div>

          {enProceso && paciente.guardadoHace && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CloudCheck className="size-3.5" />
              Guardado hace {paciente.guardadoHace}
            </p>
          )}

          {paciente.estado === "no_disponible" && paciente.motivoNoDisponible && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <CircleAlert className="size-3.5 shrink-0 translate-y-0.5" />
              <p>
                <span className="font-medium">Motivo:</span>{" "}
                {paciente.motivoNoDisponible}
                {paciente.horaReporte && ` Reportado a las ${paciente.horaReporte}.`}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col justify-center gap-2.5 border-t pt-4 sm:w-48 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
          {paciente.estado === "pendiente" && (
            <>
              <Button
                type="button"
                className="h-11 text-sm"
                onClick={() => onIniciar(paciente)}
              >
                <ClipboardPlus data-icon="inline-start" />
                Iniciar
              </Button>
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 text-sm"
                  onClick={() => onMarcarNoDisponible(paciente)}
                >
                  <BedDouble data-icon="inline-start" />
                  No Disp.
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                  aria-label="Rechazar"
                  onClick={() => onRechazar(paciente)}
                >
                  <CircleX />
                </Button>
              </div>
            </>
          )}

          {enProceso && (
            <Button
              type="button"
              className="h-11 bg-accent text-sm text-accent-foreground hover:bg-accent/80"
              onClick={() => onContinuar(paciente)}
            >
              <Play data-icon="inline-start" />
              Continuar
            </Button>
          )}

          {paciente.estado === "completada" && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-sm text-primary hover:text-primary"
              onClick={() => onVer(paciente)}
            >
              <Eye data-icon="inline-start" />
              Ver
            </Button>
          )}

          {paciente.estado === "no_disponible" && (
            <Button
              type="button"
              variant="outline"
              className="h-11 text-sm"
              onClick={() => onReintentar(paciente)}
            >
              <RotateCcw data-icon="inline-start" />
              Reintentar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
