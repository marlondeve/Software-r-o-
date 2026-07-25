import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import { useMemo } from "react"
import { Eye, MoreHorizontal, PencilLine } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { construirAccionesDietaFila } from "@/modules/dietas-cocina/dietas/lib/dietasAcciones"
import {
  cnFilaTabla,
  formatearUbicacion,
} from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import {
  formatearIdentificacionPaciente,
  formatearUbicacionPaciente,
} from "@/modules/dietas-cocina/lib/mapearAtencionHospitalariaAFilaDieta"
import {
  esSolicitudEditable,
} from "@/modules/dietas-cocina/dietas/lib/solicitudDieta"

interface DietasTablaProps {
  filas: FilaDieta[]
  seleccionados: Set<string>
  onToggleFila: (id: string, checked: boolean) => void
  onToggleTodas: (checked: boolean) => void
  onAbrirSolicitud: (fila: FilaDieta) => void
  onAbrirDetalle: (fila: FilaDieta) => void
  onRegistrarNovedad: (fila: FilaDieta) => void
  onCancelarDieta: (fila: FilaDieta) => void
}

export function DietasTabla({
  filas,
  seleccionados,
  onToggleFila,
  onToggleTodas,
  onAbrirSolicitud,
  onAbrirDetalle,
  onRegistrarNovedad,
  onCancelarDieta,
}: DietasTablaProps) {
  const todasSeleccionadas =
    filas.length > 0 && filas.every((fila) => seleccionados.has(fila.id))
  const algunasSeleccionadas =
    filas.some((fila) => seleccionados.has(fila.id)) && !todasSeleccionadas

  const columnas = useMemo<ColumnDef<FilaDieta>[]>(
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
            aria-label="Seleccionar todos los pacientes"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={seleccionados.has(row.original.id)}
            onCheckedChange={(checked) =>
              onToggleFila(row.original.id, checked === true)
            }
            aria-label={`Seleccionar ${row.original.paciente}`}
          />
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => <EstadoBadge estado={row.original.estado} />,
      },
      {
        id: "paciente",
        header: "Paciente",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.paciente}</p>
            <p className="text-xs text-muted-foreground">
              {formatearIdentificacionPaciente(row.original)}
            </p>
            <p className="text-xs text-muted-foreground/80">
              {formatearUbicacionPaciente(row.original)}
            </p>
          </div>
        ),
      },
      {
        id: "ubicacion",
        header: "Ubicación",
        cell: ({ row }) => (
          <div>
            <p className="text-foreground">{formatearUbicacion(row.original)}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.servicio}
            </p>
          </div>
        ),
      },
      {
        id: "consistencia",
        header: "Consistencia",
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.consistencia ?? "Sin asignar"}
          </span>
        ),
      },
      {
        id: "precauciones",
        header: "Precauciones",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.aislado ? (
              <Badge
                variant="outline"
                className="w-fit rounded-full border-destructive/30 bg-destructive/10 text-[10px] font-bold uppercase text-destructive"
              >
                Aislado
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
            {row.original.aislamiento !== "Ninguno" && (
              <span className="text-xs text-muted-foreground">
                {row.original.aislamiento}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "acciones",
        header: () => <span className="float-right">Acciones</span>,
        cell: ({ row }) => {
          const fila = row.original
          const puedeEditar = esSolicitudEditable(fila)
          const acciones = construirAccionesDietaFila(fila, {
            onAbrirDetalle,
            onAbrirSolicitud,
            onRegistrarNovedad,
            onCancelarDieta,
          })

          return (
            <div className="flex items-center justify-end gap-0.5">
              {puedeEditar ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="size-8 border-border bg-background shadow-xs"
                  aria-label="Editar solicitud"
                  onClick={() => onAbrirSolicitud(fila)}
                >
                  <PencilLine className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="size-8 border-border bg-background shadow-xs"
                  aria-label="Ver detalle"
                  onClick={() => onAbrirDetalle(fila)}
                >
                  <Eye className="size-4" />
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="size-8 border-border bg-background shadow-xs"
                    aria-label="Más acciones"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                  {acciones.map((accion) => (
                    <button
                      key={accion.key}
                      type="button"
                      className={
                        accion.destructive
                          ? "flex w-full rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
                          : "flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      }
                      onClick={accion.onClick}
                    >
                      {accion.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          )
        },
      },
    ],
    [
      algunasSeleccionadas,
      onAbrirDetalle,
      onAbrirSolicitud,
      onCancelarDieta,
      onRegistrarNovedad,
      onToggleFila,
      onToggleTodas,
      seleccionados,
      todasSeleccionadas,
    ],
  )

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-0">
        <DataTable
          columns={columnas}
          data={filas}
          className="rounded-none border-0"
          emptyMessage="No hay pacientes para los filtros seleccionados."
          getRowClassName={(fila) =>
            cnFilaTabla(seleccionados.has(fila.id))
          }
        />
      </CardContent>
    </Card>
  )
}
