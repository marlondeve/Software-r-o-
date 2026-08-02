import type { TarifaHistorico } from "@/modules/dietas-cocina/types/catalog"
import { Clock, Tag, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  formatearMonedaTarifaGrande,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"
import {
  agruparHistoricoPorVigencia,
  labelComidaTarifa,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/tarifasPorComida"
import {
  estadoDietaCatalogoConfig,
  estadoBadgeTokens,
} from "@/modules/dietas-cocina/lib/estadosEstilos"
import { cn } from "@/lib/utils"

interface HistoricoTarifasTimelineProps {
  tarifas: TarifaHistorico[]
}

export function HistoricoTarifasTimeline({
  tarifas,
}: HistoricoTarifasTimelineProps) {
  const grupos = agruparHistoricoPorVigencia(tarifas)

  if (grupos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay tarifas registradas para esta dieta.
      </p>
    )
  }

  return (
    <ul className="space-y-0">
      {grupos.map((grupo, index) => {
        const esUltima = index === grupos.length - 1
        const vigente = grupo.vigente

        return (
          <li key={grupo.clave} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                  vigente
                    ? "border-primary bg-primary/10 text-primary"
                    : cn("border-border bg-muted", estadoBadgeTokens.neutral),
                )}
              >
                {vigente ? (
                  <Tag className="size-4" aria-hidden />
                ) : (
                  <Clock className="size-4" aria-hidden />
                )}
              </span>
              {!esUltima && (
                <span className="my-1 w-0.5 flex-1 min-h-8 bg-border" />
              )}
            </div>

            <Card
              className={cn(
                "mb-4 flex-1 py-0",
                vigente ? "border-primary/20" : "opacity-90",
              )}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Año {grupo.anio}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      vigente
                        ? estadoDietaCatalogoConfig.vigente.className
                        : estadoDietaCatalogoConfig.vencida.className,
                    )}
                  >
                    {vigente ? estadoDietaCatalogoConfig.vigente.label : estadoDietaCatalogoConfig.vencida.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {grupo.tarifas
                    .sort((a, b) =>
                      labelComidaTarifa(a.comida).localeCompare(
                        labelComidaTarifa(b.comida),
                      ),
                    )
                    .map((tarifa) => (
                      <div
                        key={tarifa.id}
                        className="rounded-md border border-border/60 px-3 py-2"
                      >
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {labelComidaTarifa(tarifa.comida)}
                        </p>
                        <p
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            vigente ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {formatearMonedaTarifaGrande(tarifa.monto)}
                        </p>
                      </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-semibold uppercase text-muted-foreground">
                      Vigencia
                    </p>
                    <p>
                      {grupo.vigenciaDesde} - {grupo.vigenciaHasta}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase text-muted-foreground">
                      Registrado por
                    </p>
                    <p className="flex items-center gap-1">
                      <User className="size-3" />
                      {grupo.registradoPor}
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-muted/60 px-3 py-2 text-xs">
                  <span className="font-semibold uppercase text-muted-foreground">
                    Motivo del cambio:{" "}
                  </span>
                  {grupo.motivoCambio}
                </div>

                <div className="flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
                  <span>{grupo.tarifas.length} tarifa(s) por comida</span>
                  <span>Creado: {grupo.creadoEn}</span>
                </div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
