import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  claseBadgeLogistica,
  etiquetaLogisticaLabel,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import { cn } from "@/lib/utils"

export function ListadoBandejasRecibidasEnPiso({
  bandejas,
}: {
  bandejas: EtiquetaEnfermera[]
}) {
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <h3 className="font-semibold">Bandejas recibidas en piso</h3>
        <p className="text-sm font-normal text-muted-foreground">
          Confirmadas en recepción del proveedor; seguimiento de entrega al
          paciente por el auxiliar de piso.
        </p>
      </CardHeader>
      <CardContent className="p-0">
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
                className={cn("text-xs", claseBadgeLogistica(e.estadoLogistica))}
              >
                {etiquetaLogisticaLabel(e.estadoLogistica, e)}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
