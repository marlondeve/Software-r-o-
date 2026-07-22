import { useMemo } from "react"
import { Eye, PencilLine, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { EstadoConciliacionBadge } from "@/modules/dietas-cocina/conciliacion/components/EstadoConciliacionBadge"
import type { FilaConciliacion } from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"
import {
  claseDiferenciaCantidad,
  claseDiferenciaEconomica,
  conciliacionColores,
  filaRequiereAtencion,
} from "@/modules/dietas-cocina/conciliacion/lib/conciliacionEstilos"
import { cn } from "@/lib/utils"

interface ConciliacionTablaProps {
  filas: FilaConciliacion[]
  onVerDetalle: (id: string) => void
}

export function ConciliacionTabla({ filas, onVerDetalle }: ConciliacionTablaProps) {
  const columnas = useMemo<ColumnDef<FilaConciliacion>[]>(
    () => [
      {
        id: "tipo",
        header: "Tipo / Consistencia",
        cell: ({ row }) => (
          <>
            <p className="font-medium text-foreground">{row.original.tipo}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.consistencia}
            </p>
          </>
        ),
      },
      { accessorKey: "tiempo", header: "Tiempo" },
      {
        id: "tarifa",
        header: "Tarifa",
        cell: ({ row }) => (
          <span
            className={cn(
              "tabular-nums",
              row.original.tarifaAlerta &&
                `font-medium ${conciliacionColores.alerta}`,
            )}
          >
            {row.original.tarifa}
            {row.original.tarifaAlerta && "*"}
          </span>
        ),
      },
      {
        accessorKey: "cantSist",
        header: () => <span className="float-right">Cant. Sist.</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums text-foreground">
            {row.original.cantSist}
          </span>
        ),
      },
      {
        accessorKey: "cantFact",
        header: () => <span className="float-right">Cant. Fact.</span>,
        cell: ({ row }) => {
          const claseCant = claseDiferenciaCantidad(row.original)
          return (
            <span
              className={cn(
                "block text-right tabular-nums",
                claseCant || "text-foreground",
              )}
            >
              {row.original.cantFact}
            </span>
          )
        },
      },
      {
        id: "difCant",
        header: () => <span className="float-right">Dif. Cant.</span>,
        cell: ({ row }) => {
          const claseCant = claseDiferenciaCantidad(row.original)
          return (
            <span
              className={cn(
                "block text-right tabular-nums font-medium",
                claseCant || "text-foreground",
              )}
            >
              {row.original.difCant > 0
                ? `+${row.original.difCant}`
                : row.original.difCant}
            </span>
          )
        },
      },
      {
        accessorKey: "difEconomica",
        header: () => <span className="float-right">Dif. Económica</span>,
        cell: ({ row }) => {
          const claseEco = claseDiferenciaEconomica(row.original)
          return (
            <span
              className={cn(
                "block text-right tabular-nums font-medium",
                claseEco || "text-foreground",
              )}
            >
              {row.original.difEconomica}
            </span>
          )
        },
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <EstadoConciliacionBadge estado={row.original.estado} />
        ),
      },
      {
        id: "accion",
        header: () => <span className="float-right">Acción</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onVerDetalle(row.original.id)}
              aria-label="Ver detalle de conciliación"
            >
              {row.original.estado === "conciliado-manual" ? (
                <PencilLine className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [onVerDetalle],
  )

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3">
        <CardTitle className="text-sm font-semibold">Detalle Consolidado</CardTitle>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar dieta..."
            className="h-8 bg-muted/50 pl-9 shadow-none"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          columns={columnas}
          data={filas}
          className="rounded-none border-0"
          getRowClassName={(fila) =>
            filaRequiereAtencion(fila) ? conciliacionColores.alertaFila : undefined
          }
        />
      </CardContent>
    </Card>
  )
}
