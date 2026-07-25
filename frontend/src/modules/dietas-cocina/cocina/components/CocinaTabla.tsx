import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { useMemo } from "react"
import { AlertTriangle, ShieldAlert, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  claseBadgeEstadoVisibleCocina,
  enmascararId,
  labelEstadoVisibleCocina,
  claseTipoDieta,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import { cn } from "@/lib/utils"

interface CocinaTablaProps {
  ordenes: OrdenCocina[]
  seleccionados: Set<string>
  onToggleFila: (id: string, checked: boolean) => void
  onToggleTodas: (checked: boolean) => void
  onAbrirDetalle: (orden: OrdenCocina) => void
  getEtiquetaByOrdenId?: (ordenId: string) => EtiquetaEnfermera | undefined
}

const badgeAlergiaClassName =
  "border-destructive/30 bg-destructive/10 text-[10px] font-bold uppercase text-destructive"

function BadgeEstadoCocina({
  orden,
  etiqueta,
}: {
  orden: OrdenCocina
  etiqueta?: EtiquetaEnfermera
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        claseBadgeEstadoVisibleCocina(orden, etiqueta),
      )}
    >
      {labelEstadoVisibleCocina(orden, etiqueta)}
    </span>
  )
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
          return <BadgeEstadoCocina orden={row.original} etiqueta={etiqueta} />
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
              <>
                <Badge variant="outline" className={badgeAlergiaClassName}>
                  Alergia
                </Badge>
                <ShieldAlert
                  className="size-4 shrink-0 text-destructive"
                  aria-hidden
                />
              </>
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
              <div
                className="mb-1 flex flex-wrap items-center gap-1.5"
                role="note"
                aria-label={`Alergias: ${row.original.alergias.join(", ")}`}
              >
                <Badge variant="outline" className={badgeAlergiaClassName}>
                  Alergia
                </Badge>
                <p className="text-xs font-semibold text-destructive">
                  {row.original.alergias.join(", ")}
                </p>
              </div>
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
        header: () => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted underline-offset-4">
                Etiq.
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-xs">
              Ícono gris: etiqueta pendiente de impresión. Ícono verde: etiqueta
              ya impresa.
            </TooltipContent>
          </Tooltip>
        ),
        cell: ({ row }) => {
          const impresa = row.original.etiquetaImpresa
          const etiquetaLabel = impresa
            ? "Etiqueta impresa"
            : "Etiqueta pendiente de impresión"

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex"
                  aria-label={etiquetaLabel}
                  tabIndex={0}
                >
                  <Tag
                    className={cn(
                      "size-4",
                      impresa
                        ? "fill-teal-600 text-teal-600"
                        : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {etiquetaLabel}
              </TooltipContent>
            </Tooltip>
          )
        },
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Leyenda etiquetas:</span>
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground" aria-hidden />
            Pendiente de impresión
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Tag
              className="size-3.5 fill-teal-600 text-teal-600"
              aria-hidden
            />
            Impresa
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
