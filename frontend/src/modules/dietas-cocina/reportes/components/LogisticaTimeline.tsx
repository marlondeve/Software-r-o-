import { ArrowRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  tendenciaVariantEstilos,
  type TendenciaVariant,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"
import { normalizarTiempoHitoAHhMm } from "@/modules/dietas-cocina/reportes/lib/formatearDuracionHhMm"
import { cn } from "@/lib/utils"

interface HitoLogistico {
  etapa: string
  tiempo: string
  tendencia: string
  tendenciaVariant: TendenciaVariant
}

interface LogisticaTimelineProps {
  hitos: HitoLogistico[]
  titulo?: string
}

function DuracionHitoDisplay({ tiempo }: { tiempo: string }) {
  const normalizado = normalizarTiempoHitoAHhMm(tiempo)
  const partes = normalizado.match(/^(\d{1,4}):([0-5]\d)$/)

  if (!partes) {
    return (
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {tiempo}
      </p>
    )
  }

  const horas = partes[1].padStart(2, "0")
  const minutos = partes[2]

  return (
    <div
      className="mt-1 inline-flex items-end gap-0.5 tabular-nums"
      aria-label={`${Number(horas)} horas y ${Number(minutos)} minutos`}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          h
        </span>
        <span className="min-w-[2ch] text-center text-lg font-semibold leading-none text-foreground">
          {horas}
        </span>
      </div>
      <span
        className="pb-0.5 text-lg font-semibold leading-none text-muted-foreground"
        aria-hidden
      >
        :
      </span>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          m
        </span>
        <span className="min-w-[2ch] text-center text-lg font-semibold leading-none text-foreground">
          {minutos}
        </span>
      </div>
    </div>
  )
}

export function LogisticaTimeline({
  hitos,
  titulo = "Tiempos por hito logístico",
}: LogisticaTimelineProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
        <CardDescription>
          Duración promedio entre etapas, en{" "}
          <span className="font-medium text-foreground/80">horas (h)</span> y{" "}
          <span className="font-medium text-foreground/80">minutos (m)</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {hitos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin datos de tiempos logísticos para el período seleccionado.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {hitos.map((hito, index) => (
              <div key={hito.etapa} className="relative flex items-start gap-2">
                {index < hitos.length - 1 && (
                  <ArrowRight className="absolute -right-1 top-2 hidden size-3.5 text-muted-foreground xl:block" />
                )}
                <div className="min-w-0 flex-1 rounded-lg bg-muted/40 px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">{hito.etapa}</p>
                  <DuracionHitoDisplay tiempo={hito.tiempo} />
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-medium",
                      tendenciaVariantEstilos[hito.tendenciaVariant],
                    )}
                  >
                    {hito.tendencia}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
