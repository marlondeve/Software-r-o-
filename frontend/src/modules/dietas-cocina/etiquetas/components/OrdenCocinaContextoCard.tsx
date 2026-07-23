import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  claseBadgeEstadoVisibleCocina,
  descripcionEstadoLogisticaCocina,
  labelEstadoVisibleCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import {
  checklistProgreso,
  puedeEditarChecklist,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { cn } from "@/lib/utils"

interface OrdenCocinaContextoCardProps {
  orden: OrdenCocina
  etiqueta?: EtiquetaEnfermera
}

export function OrdenCocinaContextoCard({
  orden,
  etiqueta,
}: OrdenCocinaContextoCardProps) {
  const { pendientes } = checklistProgreso(orden)
  const checklistActivo = puedeEditarChecklist(orden)
  const descripcionLogistica = descripcionEstadoLogisticaCocina(orden, etiqueta)

  return (
    <Card>
      <CardHeader className="border-b py-3">
        <p className="text-sm font-semibold text-primary">Estado en cocina</p>
      </CardHeader>
      <CardContent className="space-y-2 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Preparación</span>
          <Badge
            variant="outline"
            className={cn(claseBadgeEstadoVisibleCocina(orden, etiqueta))}
          >
            {labelEstadoVisibleCocina(orden, etiqueta)}
          </Badge>
        </div>
        {descripcionLogistica && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Logística</span>
            <Badge variant="secondary" className="font-normal">
              {descripcionLogistica}
            </Badge>
          </div>
        )}
        {checklistActivo && pendientes > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {pendientes} ítem(s) obligatorio(s) del checklist pendientes en
            cocina.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
