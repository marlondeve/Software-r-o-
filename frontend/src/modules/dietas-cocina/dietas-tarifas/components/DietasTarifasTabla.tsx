import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { DietasTarifasAccionesPopover } from "@/modules/dietas-cocina/dietas-tarifas/components/DietasTarifasAccionesPopover"
import { EstadoDietaCatalogoBadge } from "@/modules/dietas-cocina/dietas-tarifas/components/EstadoDietaCatalogoBadge"
import type { DietaCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import { formatearMonedaTarifa } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

interface DietasTarifasTablaProps {
  dietas: DietaCatalogo[]
  paginaActual: number
  totalPaginas: number
  totalRegistros: number
  tamanoPagina: number
  onCambiarPagina: (pagina: number) => void
  onEditar: (dieta: DietaCatalogo) => void
  onHistorico: (dieta: DietaCatalogo) => void
  onNuevaTarifa: (dieta: DietaCatalogo) => void
  onDesactivar: (dieta: DietaCatalogo) => void
}

function numerosPagina(total: number): number[] {
  return Array.from({ length: total }, (_, i) => i + 1)
}

export function DietasTarifasTabla({
  dietas,
  paginaActual,
  totalPaginas,
  totalRegistros,
  tamanoPagina,
  onCambiarPagina,
  onEditar,
  onHistorico,
  onNuevaTarifa,
  onDesactivar,
}: DietasTarifasTablaProps) {
  const desde = (paginaActual - 1) * tamanoPagina + 1
  const hasta = Math.min(paginaActual * tamanoPagina, totalRegistros)

  const columnas = useMemo<ColumnDef<DietaCatalogo>[]>(
    () => [
      {
        id: "codigo",
        header: () => (
          <span className="text-xs font-semibold uppercase">Código</span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.codigo}</span>
        ),
      },
      {
        id: "nombre",
        header: () => (
          <span className="text-xs font-semibold uppercase">Nombre de dieta</span>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.nombre}</span>
        ),
      },
      {
        id: "descripcion",
        header: () => (
          <span className="text-xs font-semibold uppercase">Descripción</span>
        ),
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-200px text-sm text-muted-foreground">
            {row.original.descripcion}
          </span>
        ),
      },
      {
        id: "estado",
        header: () => (
          <span className="text-xs font-semibold uppercase">Estado</span>
        ),
        cell: ({ row }) => (
          <EstadoDietaCatalogoBadge estado={row.original.estado} />
        ),
      },
      {
        id: "tarifa",
        header: () => (
          <span className="text-xs font-semibold uppercase">Tarifa vigente</span>
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatearMonedaTarifa(row.original.tarifaVigente)}
          </span>
        ),
      },
      {
        id: "fechaInicio",
        header: () => (
          <span className="text-xs font-semibold uppercase">Fecha de inicio</span>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.fechaInicio}</span>
        ),
      },
      {
        id: "fechaFin",
        header: () => (
          <span className="text-xs font-semibold uppercase">Fecha de fin</span>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.fechaFin ?? "—"}</span>
        ),
      },
      {
        id: "actualizacion",
        header: () => (
          <span className="text-xs font-semibold uppercase">
            Última actualización
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.ultimaActualizacion}
          </span>
        ),
      },
      {
        id: "usuario",
        header: () => (
          <span className="text-xs font-semibold uppercase">Usuario</span>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.usuario}</span>
        ),
      },
      {
        id: "acciones",
        header: () => (
          <span className="text-xs font-semibold uppercase">Acciones</span>
        ),
        cell: ({ row }) => (
          <DietasTarifasAccionesPopover
            dieta={row.original}
            onEditar={onEditar}
            onHistorico={onHistorico}
            onNuevaTarifa={onNuevaTarifa}
            onDesactivar={onDesactivar}
          />
        ),
      },
    ],
    [onEditar, onHistorico, onNuevaTarifa, onDesactivar],
  )

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <DataTable
        columns={columnas}
        data={dietas}
        className="rounded-none border-0"
        emptyMessage="No hay dietas en el catálogo."
      />

      <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {desde} a {hasta} de {totalRegistros} registros
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={paginaActual <= 1}
            onClick={() => onCambiarPagina(paginaActual - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {numerosPagina(totalPaginas).map((numero) => (
            <Button
              key={numero}
              type="button"
              variant={numero === paginaActual ? "default" : "outline"}
              size="icon-sm"
              onClick={() => onCambiarPagina(numero)}
            >
              {numero}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={paginaActual >= totalPaginas}
            onClick={() => onCambiarPagina(paginaActual + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
