import { useMemo } from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { ResultadoAuditoriaBadge } from "@/modules/encuestas/auditoria/components/ResultadoAuditoriaBadge"
import type { FilaAuditoriaEncuesta } from "@/modules/encuestas/auditoria/datos/mockAuditoriaEncuestas"

const REGISTROS_POR_PAGINA = 5

function numerosPagina(total: number) {
  return Array.from({ length: total }, (_, index) => index + 1).slice(0, 3)
}

function DetalleCell({ detalle }: { detalle: FilaAuditoriaEncuesta["detalle"] }) {
  if (detalle.tipo === "texto") {
    return <span className="text-sm text-muted-foreground">{detalle.texto}</span>
  }

  return (
    <div className="space-y-0.5 text-sm">
      <p className="text-muted-foreground line-through">{detalle.antes}</p>
      <p className="font-medium text-primary">{detalle.despues}</p>
    </div>
  )
}

interface AuditoriaTablaProps {
  filas: FilaAuditoriaEncuesta[]
  totalRegistros: number
  onVerDetalle: (fila: FilaAuditoriaEncuesta) => void
}

export function AuditoriaTabla({ filas, totalRegistros, onVerDetalle }: AuditoriaTablaProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA))

  const columnas = useMemo<ColumnDef<FilaAuditoriaEncuesta>[]>(
    () => [
      {
        id: "fecha",
        header: "Fecha / Hora",
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-foreground">{row.original.fecha}</p>
            <p className="text-xs text-muted-foreground">{row.original.relativo}</p>
          </div>
        ),
      },
      {
        id: "usuario",
        header: "Usuario",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">
              {row.original.usuarioNombre}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.usuarioRol}</p>
          </div>
        ),
      },
      {
        accessorKey: "modulo",
        header: "Módulo",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.modulo}</span>
        ),
      },
      {
        id: "accion",
        header: "Acción",
        cell: ({ row }) =>
          row.original.accionAlerta ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
              <TriangleAlert className="size-4" />
              {row.original.accion}
            </span>
          ) : (
            <span className="text-sm font-medium text-foreground">{row.original.accion}</span>
          ),
      },
      {
        id: "idRegistro",
        header: "ID Reg / Paciente",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.idRegistro}</p>
            <p className="text-xs text-muted-foreground">{row.original.idSecundario}</p>
          </div>
        ),
      },
      {
        id: "detalle",
        header: "Detalle / Cambio",
        cell: ({ row }) => <DetalleCell detalle={row.original.detalle} />,
      },
      {
        id: "resultado",
        header: "Resultado",
        cell: ({ row }) => <ResultadoAuditoriaBadge resultado={row.original.resultado} />,
      },
      {
        id: "origen",
        header: "Origen",
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-foreground">{row.original.origenIp}</p>
            <p className="text-xs text-muted-foreground">{row.original.origenDispositivo}</p>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <DataTable
        columns={columnas}
        data={filas}
        className="rounded-none border-0"
        onRowClick={onVerDetalle}
      />

      <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando 1 a {filas.length} de {totalRegistros.toLocaleString("es-CO")} registros
        </p>

        <div className="flex items-center gap-1.5">
          <Button type="button" variant="outline" size="icon" className="size-10" disabled>
            <ChevronLeft className="size-4" />
          </Button>
          {numerosPagina(totalPaginas).map((numero) => (
            <Button
              key={numero}
              type="button"
              variant={numero === 1 ? "default" : "outline"}
              size="icon"
              className="size-10"
            >
              {numero}
            </Button>
          ))}
          {totalPaginas > 3 && (
            <span className="px-1 text-muted-foreground">
              <MoreHorizontal className="size-4" />
            </span>
          )}
          <Button type="button" variant="outline" size="icon" className="size-10">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
