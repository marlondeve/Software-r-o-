import { useMemo } from "react"
import { TriangleAlert } from "lucide-react"

import { Card } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { TablaPaginacion } from "@/components/shared/TablaPaginacion"
import { ResultadoAuditoriaBadge } from "@/modules/encuestas/auditoria/components/ResultadoAuditoriaBadge"
import type { FilaAuditoriaEncuesta } from "@/modules/encuestas/types/audit"

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
  paginaDesde: number
  paginaHasta: number
  totalRegistros: number
  paginaActual: number
  totalPaginas: number
  onCambiarPagina: (pagina: number) => void
  onVerDetalle: (fila: FilaAuditoriaEncuesta) => void
}

export function AuditoriaTabla({
  filas,
  paginaDesde,
  paginaHasta,
  totalRegistros,
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  onVerDetalle,
}: AuditoriaTablaProps) {
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
            <p className="text-sm font-medium text-foreground">{row.original.usuarioNombre}</p>
            <p className="text-xs text-muted-foreground">{row.original.usuarioRol}</p>
          </div>
        ),
      },
      {
        accessorKey: "modulo",
        header: "Módulo",
        cell: ({ row }) => <span className="text-sm text-foreground">{row.original.modulo}</span>,
      },
      {
        accessorKey: "accion",
        header: "Acción",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
            {row.original.accionAlerta && (
              <TriangleAlert className="size-3.5 text-destructive" aria-hidden />
            )}
            {row.original.accion}
          </span>
        ),
      },
      {
        id: "detalle",
        header: "Detalle",
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

      <TablaPaginacion
        paginaDesde={paginaDesde}
        paginaHasta={paginaHasta}
        total={totalRegistros}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onCambiarPagina={onCambiarPagina}
      />
    </Card>
  )
}
