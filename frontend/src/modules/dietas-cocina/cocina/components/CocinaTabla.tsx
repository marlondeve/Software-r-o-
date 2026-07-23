import { useMemo } from "react"
import { AlertTriangle, ShieldAlert, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  claseBadgeEstadoVisibleCocina,
  enmascararId,
  labelEstadoVisibleCocina,
  claseTipoDieta,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { cn } from "@/lib/utils"

interface CocinaTablaProps {
  ordenes: OrdenCocina[]
  seleccionados: Set<string>
  onToggleFila: (id: string, checked: boolean) => void
  onToggleTodas: (checked: boolean) => void
  onAbrirDetalle: (orden: OrdenCocina) => void
  getEtiquetaByOrdenId?: (ordenId: string) => EtiquetaEnfermera | undefined
}

export function CocinaTabla({
  ordenes,
  seleccionados,
  onToggleFila,
  onToggleTodas,
  onAbrirDetalle,
  getEtiquetaByOrdenId,
}: CocinaTablaProps) {
  const todasSeleccionadas =
    ordenes.length > 0 && ordenes.every((o) => seleccionados.has(o.id))
  const algunasSeleccionadas =
    ordenes.some((o) => seleccionados.has(o.id)) && !todasSeleccionadas

  const columnas = useMemo<ColumnDef<OrdenCocina>[]>(
    () => [
      {
        id: "seleccion",
        header: () => (
          <Checkbox
            checked={
              todasSeleccionadas
                ? true
                : algunasSeleccionadas
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) => onToggleTodas(checked === true)}
            aria-label="Seleccionar todas las bandejas"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={seleccionados.has(row.original.id)}
            onCheckedChange={(checked) =>
              onToggleFila(row.original.id, checked === true)
            }
            onClick={(e) => e.stopPropagation()}
            aria-label={`Seleccionar ${row.original.paciente}`}
          />
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const etiqueta = getEtiquetaByOrdenId?.(row.original.id)
          return (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full font-medium",
                claseBadgeEstadoVisibleCocina(row.original, etiqueta),
              )}
            >
              {labelEstadoVisibleCocina(row.original, etiqueta)}
            </Badge>
          )
        },
      },
      {
        id: "ubicacion",
        header: "Ubicación",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.pabellon}</p>
            <p className="text-xs text-muted-foreground">
              Hab {row.original.habitacion}
              {row.original.cama ? ` · ${row.original.cama}` : ""}
            </p>
          </div>
        ),
      },
      {
        id: "paciente",
        header: "Paciente / ID",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.paciente}</p>
            <p className="text-xs text-muted-foreground">
              {enmascararId(row.original.pacienteId)} · {row.original.edad} años
            </p>
          </div>
        ),
      },
      {
        id: "dieta",
        header: "Dieta / Consistencia",
        cell: ({ row }) => (
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                claseTipoDieta(row.original.tipoDieta),
              )}
            >
              {row.original.tipoDieta}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.consistencia}
            </p>
          </div>
        ),
      },
      {
        id: "alertas",
        header: "Alertas",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            {row.original.aislado && (
              <Badge
                variant="outline"
                className="border-destructive/30 bg-destructive/10 text-[10px] font-bold uppercase text-destructive"
              >
                Aislado
              </Badge>
            )}
            {row.original.alergias.length > 0 && (
              <ShieldAlert
                className="size-4 text-destructive"
                aria-label={`Alergias: ${row.original.alergias.join(", ")}`}
              />
            )}
          </div>
        ),
      },
      {
        id: "observaciones",
        header: "Observaciones",
        cell: ({ row }) => (
          <div className="max-w-50">
            {row.original.alergias.length > 0 && (
              <p className="text-xs font-medium text-destructive">
                {row.original.alergias.join(", ")}
              </p>
            )}
            {row.original.observaciones ? (
              <p className="truncate text-sm text-muted-foreground">
                {row.original.observaciones}
              </p>
            ) : (
              !row.original.alergias.length && (
                <span className="text-sm text-muted-foreground">—</span>
              )
            )}
          </div>
        ),
      },
      {
        id: "etiqueta",
        header: "Etiq.",
        cell: ({ row }) => (
          <Tag
            className={cn(
              "size-4",
              row.original.etiquetaImpresa
                ? "fill-teal-600 text-teal-600"
                : "text-muted-foreground",
            )}
            aria-label={
              row.original.etiquetaImpresa
                ? "Etiqueta impresa"
                : "Etiqueta pendiente"
            }
          />
        ),
      },
    ],
    [
      todasSeleccionadas,
      algunasSeleccionadas,
      seleccionados,
      onToggleFila,
      getEtiquetaByOrdenId,
    ],
  )

  if (ordenes.length === 0) {
    return (
      <Card>
        <CardContent className="px-6 py-12 text-center">
          <AlertTriangle className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No hay bandejas para este turno
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajusta los filtros o cambia el tiempo de comida.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <DataTable
          columns={columnas}
          data={ordenes}
          className="border-0"
          emptyMessage="No hay órdenes para los filtros seleccionados."
          onRowClick={(orden) => onAbrirDetalle(orden)}
        />
      </CardContent>
    </Card>
  )
}
