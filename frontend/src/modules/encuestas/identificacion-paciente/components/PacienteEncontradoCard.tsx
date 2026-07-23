import { CircleCheck, Phone, RefreshCw, ShieldCheck, TriangleAlert, UserCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { PacienteEncontrado } from "@/modules/encuestas/identificacion-paciente/datos/mockIdentificacionPaciente"

interface InfoCampoProps {
  label: string
  valor: string
  nota?: string
}

function InfoCampo({ label, valor, nota }: InfoCampoProps) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{valor}</p>
    </div>
  )
}

interface PacienteEncontradoCardProps {
  paciente: PacienteEncontrado
  onReportarInconsistencia: () => void
  onIniciarEncuesta: () => void
}

export function PacienteEncontradoCard({
  paciente,
  onReportarInconsistencia,
  onIniciarEncuesta,
}: PacienteEncontradoCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none ring-1 ring-primary/30">
      <div className="h-1 w-full bg-primary" />

      <CardContent className="space-y-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              {paciente.nombre}
              <ShieldCheck className="size-4 text-primary" />
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {paciente.documento} • {paciente.edad} años • {paciente.sexo}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex flex-wrap justify-end gap-2">
              {paciente.elegible && (
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/10 font-medium text-primary"
                >
                  <CircleCheck data-icon="inline-start" />
                  Elegible para Encuesta
                </Badge>
              )}
              <Badge
                variant="outline"
                className="rounded-full border-border bg-muted font-medium text-foreground"
              >
                {paciente.canal === "telefonica" ? (
                  <Phone data-icon="inline-start" />
                ) : (
                  <UserCheck data-icon="inline-start" />
                )}
                {paciente.canal === "telefonica" ? "Telefónica" : "Presencial"}
              </Badge>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="size-3" />
              Información precargada desde SISMA
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoCampo label="Entidad / EPS" valor={paciente.entidadEps} />
          <InfoCampo label="Contrato" valor={paciente.contrato} />
          <InfoCampo label="Servicio" valor={paciente.servicio} />
          <InfoCampo label="Punto de Atención" valor={paciente.puntoAtencion} />
          <div className="sm:col-span-2">
            <InfoCampo
              label="Fecha de Atención"
              valor={paciente.fechaAtencion}
              nota={paciente.fechaRelativa}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onReportarInconsistencia}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline"
          >
            <TriangleAlert className="size-4" />
            Reportar inconsistencia
          </button>
          <Button type="button" className="h-11" onClick={onIniciarEncuesta}>
            Iniciar Encuesta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
