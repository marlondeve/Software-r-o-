import {
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  CircleCheck,
  Heart,
  MessageSquareText,
  Smile,
  ThumbsUp,
  TriangleAlert,
  User,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type {
  PacienteContextoEncuesta,
  SeccionEncuesta,
} from "@/modules/encuestas/captura-encuesta/datos/mockCapturaEncuesta"

const ICONOS_SECCION: Record<string, LucideIcon> = {
  "satisfaccion-global": Smile,
  recomendacion: ThumbsUp,
  "tiempos-espera": Clock,
  "trato-personal": Heart,
  instalaciones: Building2,
  comunicacion: Smile,
  "comentarios-adicionales": MessageSquareText,
}

export interface RespuestaResumen {
  seccion: SeccionEncuesta
  etiqueta: string
}

interface RevisionFinalStepProps {
  paciente: PacienteContextoEncuesta
  encuestador: string
  fechaHora: string
  resumen: RespuestaResumen[]
}

export function RevisionFinalStep({
  paciente,
  encuestador,
  fechaHora,
  resumen,
}: RevisionFinalStepProps) {
  return (
    <div className="space-y-4">
      <Card className="gap-0 py-5 shadow-none">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="size-7 text-primary" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Paciente
                </p>
                <p className="text-lg font-semibold text-foreground">{paciente.nombre}</p>
                <p className="text-sm text-muted-foreground">{paciente.documento}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Fecha / Hora
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <CalendarDays className="size-3.5" />
                {fechaHora}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Canal
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {paciente.canal === "telefonica" ? "Telefónica" : "Presencial"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Servicio
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{paciente.servicio}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Aseguradora
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{paciente.eps}</p>
              {paciente.contrato && (
                <p className="text-xs text-muted-foreground">{paciente.contrato}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Encuestador
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Briefcase className="size-3.5" />
                {encuestador}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg bg-primary/10 px-4 py-3.5">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Validación exitosa</p>
          <p className="text-sm text-muted-foreground">
            Todas las preguntas obligatorias han sido completadas. No se detectaron
            inconsistencias.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Resumen de Respuestas</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {resumen.map(({ seccion, etiqueta }) => {
            const Icon = ICONOS_SECCION[seccion.id] ?? Smile
            return (
              <Card key={seccion.id} className="gap-1.5 py-4 shadow-none">
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <Icon className="size-3.5" />
                      {seccion.numero}. {seccion.titulo}
                    </p>
                    {seccion.opcional && (
                      <Badge variant="outline" className="shrink-0 font-normal">
                        Opcional
                      </Badge>
                    )}
                  </div>
                  <p
                    className={cnEtiqueta(seccion.tipo === "texto_libre")}
                  >
                    {etiqueta}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3.5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">
          <span className="font-medium">Aviso importante:</span> Una vez finalizada, la
          encuesta será incluida en los indicadores institucionales y no podrá modificarse
          sin autorización.
        </p>
      </div>
    </div>
  )
}

function cnEtiqueta(esTextoLibre: boolean) {
  return esTextoLibre
    ? "text-sm text-muted-foreground italic"
    : "text-sm font-semibold text-primary"
}
