import { Clock, Tag, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { TarifaHistorico } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import {
  formatearMonedaTarifaGrande,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"
import { cn } from "@/lib/utils"

interface HistoricoTarifasTimelineProps {
  tarifas: TarifaHistorico[]
}

export function HistoricoTarifasTimeline({
  tarifas,
}: HistoricoTarifasTimelineProps) {
  const ordenadas = [...tarifas].sort((a, b) => b.anio - a.anio)

  return (
    <ul className="space-y-0">
      {ordenadas.map((tarifa, index) => {
        const esUltima = index === ordenadas.length - 1
        const vigente = tarifa.vigente

        return (
          <li key={tarifa.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                  vigente
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground",
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
                    Año {tarifa.anio}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      vigente
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {vigente ? "Vigente" : "Vencida"}
                  </Badge>
                </div>

                <p
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    vigente ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {formatearMonedaTarifaGrande(tarifa.monto)}
                </p>

                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-semibold uppercase text-muted-foreground">
                      Vigencia
                    </p>
                    <p>
                      {tarifa.vigenciaDesde} - {tarifa.vigenciaHasta}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase text-muted-foreground">
                      Registrado por
                    </p>
                    <p className="flex items-center gap-1">
                      <User className="size-3" />
                      {tarifa.registradoPor}
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-muted/60 px-3 py-2 text-xs">
                  <span className="font-semibold uppercase text-muted-foreground">
                    Motivo del cambio:{" "}
                  </span>
                  {tarifa.motivoCambio}
                </div>

                <div className="flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
                  <span>ID: {tarifa.id}</span>
                  <span>Creado: {tarifa.creadoEn}</span>
                </div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
