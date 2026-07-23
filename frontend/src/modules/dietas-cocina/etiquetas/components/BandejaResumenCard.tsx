import { UtensilsCrossed } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  etiquetaComidaLabel,
  type EtiquetaDieta,
} from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"

interface BandejaResumenCardProps {
  etiqueta: EtiquetaDieta
  compacto?: boolean
}

export function BandejaResumenCard({
  etiqueta,
  compacto = false,
}: BandejaResumenCardProps) {
  return (
    <Card>
      <CardContent className={compacto ? "space-y-2 p-4" : "space-y-3 p-5"}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Paciente</p>
            <p className="font-semibold text-foreground">{etiqueta.paciente}</p>
            <p className="text-sm text-muted-foreground">
              Habitación {etiqueta.habitacion}
              {etiqueta.pabellon ? ` · ${etiqueta.pabellon}` : ""}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 bg-sky-500/10 text-sky-700">
            {etiquetaComidaLabel(etiqueta.comida)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-3 text-sm">
          <UtensilsCrossed className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Dieta <span className="font-medium">{etiqueta.tipoDieta}</span>
            {" · "}
            {etiqueta.consistencia}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Código: {etiqueta.codigo}</p>
      </CardContent>
    </Card>
  )
}
