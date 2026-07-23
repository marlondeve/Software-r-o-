import { useMemo } from "react"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Phone,
  UserCheck,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { EstadoEncuestaBadge } from "@/modules/encuestas/encuestas-realizadas/components/EstadoEncuestaBadge"
import { SatNpsBadge } from "@/modules/encuestas/encuestas-realizadas/components/SatNpsBadge"
import type { FilaEncuestaRealizada } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"
import { cn } from "@/lib/utils"

interface EncuestasRealizadasTablaProps {
  filas: FilaEncuestaRealizada[]
  desde: number
  hasta: number
  totalRegistros: number
  paginaActual: number
  totalPaginas: number
  onCambiarPagina: (pagina: number) => void
  onVer: (fila: FilaEncuestaRealizada) => void
  onDescartar: (fila: FilaEncuestaRealizada) => void
}

function numerosPagina(total: number) {
  return Array.from({ length: total }, (_, index) => index + 1).slice(0, 3)
}

export function EncuestasRealizadasTabla({
  filas,
  desde,
  hasta,
  totalRegistros,
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  onVer,
  onDescartar,
}: EncuestasRealizadasTablaProps) {
  const columnas = useMemo<ColumnDef<FilaEncuestaRealizada>[]>(
    () => [
      {
        accessorKey: "consecutivo",
        header: "Consec.",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.consecutivo}
          </span>
        ),
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.fecha}</span>
        ),
      },
      {
        id: "paciente",
        header: "Paciente",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.paciente}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.documento} • {row.original.entidad}
            </p>
          </div>
        ),
      },
      {
        id: "servicio",
        header: "Servicio / Pto",
        cell: ({ row }) => (
          <div>
            <p className="text-foreground">{row.original.servicio}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.puntoAtencion}
            </p>
          </div>
        ),
      },
      {
        id: "canal",
        header: "Canal",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            {row.original.canal === "telefono" ? (
              <Phone className="size-3.5 text-muted-foreground" />
            ) : (
              <UserCheck className="size-3.5 text-muted-foreground" />
            )}
            {row.original.canal === "telefono" ? "Teléfono" : "Presencial"}
          </span>
        ),
      },
      {
        id: "sat",
        header: () => <div className="text-center">SAT</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <SatNpsBadge valor={row.original.sat} />
          </div>
        ),
      },
      {
        id: "nps",
        header: () => <div className="text-center">NPS</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <SatNpsBadge valor={row.original.nps} />
          </div>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <div className="space-y-1">
            <EstadoEncuestaBadge estado={row.original.estado} />
            {row.original.comentarioNegativo && (
              <p className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <AlertTriangle className="size-3" />
                Comentario Neg.
              </p>
            )}
          </div>
        ),
      },
      {
        id: "acciones",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) =>
          row.original.comentarioNegativo ? (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Ver encuesta"
                onClick={() => onVer(row.original)}
              >
                <Eye className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Descartar comentario"
                onClick={() => onDescartar(row.original)}
              >
                <XCircle className="size-4" />
              </Button>
            </div>
          ) : null,
      },
    ],
    [onVer, onDescartar],
  )

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <DataTable
        columns={columnas}
        data={filas}
        className="rounded-none border-0"
        getRowClassName={(fila) =>
          cn(fila.comentarioNegativo && "bg-destructive/5 hover:bg-destructive/10")
        }
        emptyMessage="No hay encuestas que coincidan con los filtros."
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

          {totalPaginas > 3 && (
            <span className="px-1 text-muted-foreground">
              <MoreHorizontal className="size-4" />
            </span>
          )}

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
