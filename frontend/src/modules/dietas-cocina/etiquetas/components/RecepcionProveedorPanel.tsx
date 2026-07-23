import { QrCode } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { etiquetaComidaLabel } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  claseBadgeLogistica,
  etiquetaLogisticaLabel,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import { cn } from "@/lib/utils"

interface RecepcionProveedorPanelProps {
  bandejas: EtiquetaEnfermera[]
  seleccionados: Set<string>
  onToggle: (id: string, checked: boolean) => void
  onToggleTodas: (checked: boolean) => void
  onConfirmar: () => void
  confirmando?: boolean
}

export function RecepcionProveedorPanel({
  bandejas,
  seleccionados,
  onToggle,
  onToggleTodas,
  onConfirmar,
  confirmando = false,
}: RecepcionProveedorPanelProps) {
  const idsVisibles = bandejas.map((b) => b.id)
  const seleccionadosVisibles = idsVisibles.filter((id) => seleccionados.has(id)).length
  const todoSeleccionado =
    bandejas.length > 0 && seleccionadosVisibles === bandejas.length

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Recepción del proveedor</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirma que recibiste estas bandejas del proveedor de cocina. El
              proveedor verá el estado actualizado.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild>
            <Link to="/dietas-cocina/etiquetas/pre-entrega">
              <QrCode className="size-4" />
              Escanear bandeja recibida
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {bandejas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay bandejas pendientes de recepción para este turno.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={todoSeleccionado}
                  onCheckedChange={(v) => onToggleTodas(v === true)}
                />
                Seleccionar todas ({bandejas.length})
              </label>
              <Button
                type="button"
                disabled={seleccionadosVisibles === 0 || confirmando}
                onClick={onConfirmar}
              >
                Confirmar recepción del proveedor
                {seleccionadosVisibles > 0 ? ` (${seleccionadosVisibles})` : ""}
              </Button>
            </div>

            <ul className="divide-y rounded-lg border">
              {bandejas.map((bandeja) => (
                <li
                  key={bandeja.id}
                  className="flex items-start gap-3 px-3 py-3 sm:items-center"
                >
                  <Checkbox
                    checked={seleccionados.has(bandeja.id)}
                    onCheckedChange={(v) => onToggle(bandeja.id, v === true)}
                    aria-label={`Seleccionar ${bandeja.codigo}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{bandeja.paciente}</span>
                      <Badge variant="outline" className="text-xs">
                        {etiquetaComidaLabel(bandeja.comida)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Hab. {bandeja.habitacion} · {bandeja.tipoDieta} ·{" "}
                      {bandeja.codigo}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-[10px]", claseBadgeLogistica(bandeja.estadoLogistica))}
                  >
                    {etiquetaLogisticaLabel(bandeja.estadoLogistica)}
                  </Badge>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
