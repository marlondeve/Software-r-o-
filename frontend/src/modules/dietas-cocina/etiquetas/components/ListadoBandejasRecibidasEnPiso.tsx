import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { MotivoFueraFlujoEtiqueta } from "@/modules/dietas-cocina/lib/clasificarEtiquetaCenso"
import { etiquetaFueraFlujoCensoLabel } from "@/modules/dietas-cocina/lib/clasificarEtiquetaCenso"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  claseBadgeLogistica,
  etiquetaLogisticaLabel,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import { cn } from "@/lib/utils"

export function ListadoBandejasRecibidasEnPiso({
  bandejas,
  bandejasFueraFlujo = [],
  motivoFueraFlujoPorId,
}: {
  bandejas: EtiquetaEnfermera[]
  bandejasFueraFlujo?: EtiquetaEnfermera[]
  motivoFueraFlujoPorId?: Map<string, MotivoFueraFlujoEtiqueta | undefined>
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b pb-3">
          <h3 className="font-semibold">Bandejas recibidas en piso</h3>
          <p className="text-sm font-normal text-muted-foreground">
            Confirmadas en recepción del proveedor; seguimiento de entrega al
            paciente por el auxiliar de piso.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {bandejas.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No hay bandejas activas en piso para este turno.
            </p>
          ) : (
            <ul className="divide-y">
              {bandejas.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{e.paciente}</p>
                    <p className="text-sm text-muted-foreground">
                      Hab. {e.habitacion} · Recibida {e.horaPreEntrega ?? "—"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      claseBadgeLogistica(e.estadoLogistica),
                    )}
                  >
                    {etiquetaLogisticaLabel(e.estadoLogistica, e)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {bandejasFueraFlujo.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="border-b border-amber-100 pb-3">
            <h3 className="font-semibold text-amber-950">
              Fuera de flujo ({bandejasFueraFlujo.length})
            </h3>
            <p className="text-sm font-normal text-muted-foreground">
              Historial del turno (egreso o cancelación). No cuentan en KPIs
              operativos.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {bandejasFueraFlujo.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 opacity-90"
                >
                  <div>
                    <p className="font-medium">{e.paciente}</p>
                    <p className="text-sm text-muted-foreground">
                      Hab. {e.habitacion} · Recibida {e.horaPreEntrega ?? "—"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-[10px] text-amber-900"
                  >
                    {etiquetaFueraFlujoCensoLabel(
                      motivoFueraFlujoPorId?.get(e.id),
                    )}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
