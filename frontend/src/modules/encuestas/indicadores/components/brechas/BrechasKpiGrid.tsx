import { ClipboardCheck, Info, TrendingUp, TriangleAlert, Users } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface BrechasKpiGridProps {
  totalElegibles: number
  encuestasRegistradas: number
  tendenciaEncuestas: string
  sinEncuesta: number
  cobertura: number
  excluidos: number
  inconsistencias: number
}

export function BrechasKpiGrid({
  totalElegibles,
  encuestasRegistradas,
  tendenciaEncuestas,
  sinEncuesta,
  cobertura,
  excluidos,
  inconsistencias,
}: BrechasKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="py-0 shadow-none">
        <CardContent className="flex items-start justify-between gap-2 px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Total elegibles</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {totalElegibles.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Atenciones en el periodo</p>
          </div>
          <Users className="size-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>

      <Card className="py-0 shadow-none">
        <CardContent className="flex items-start justify-between gap-2 px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Encuestas registradas</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {encuestasRegistradas.toLocaleString()}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
              <TrendingUp className="size-3.5" />
              {tendenciaEncuestas}
            </p>
          </div>
          <ClipboardCheck className="size-5 shrink-0 text-primary" />
        </CardContent>
      </Card>

      <Card className="py-0 shadow-none">
        <CardContent className="flex items-start justify-between gap-2 px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Sin encuesta (Brecha)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
              {sinEncuesta.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Atenciones pendientes</p>
          </div>
          <TriangleAlert className="size-5 shrink-0 text-destructive" />
        </CardContent>
      </Card>

      <Card className="py-0 shadow-none">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cobertura</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {cobertura}%
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${cobertura}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                Excluidos
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Atenciones excluidas del análisis de cobertura.
                  </TooltipContent>
                </Tooltip>
              </span>
              <p className="mt-0.5 text-base font-semibold text-foreground">{excluidos}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                Inconsistencias
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Registros con datos inconsistentes entre fuentes.
                  </TooltipContent>
                </Tooltip>
              </span>
              <p className="mt-0.5 text-base font-semibold text-destructive">
                {inconsistencias}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
