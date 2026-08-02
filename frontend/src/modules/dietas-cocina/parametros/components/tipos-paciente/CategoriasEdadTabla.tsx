import type { CategoriaEdad } from "@/modules/dietas-cocina/types/parameters"
import { estadoCategoriaConfig } from "@/modules/dietas-cocina/lib/estadosEstilos"
import { useMemo } from "react"
import { PencilLine, SlidersHorizontal, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"

interface CategoriasEdadTablaProps {
  categorias: CategoriaEdad[]
  onEditar: (id: string) => void
  onEliminar: (id: string) => void
}

export function CategoriasEdadTabla({
  categorias,
  onEditar,
  onEliminar,
}: CategoriasEdadTablaProps) {
  const columnas = useMemo<ColumnDef<CategoriaEdad>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: "Categoría",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.nombre}</span>
        ),
      },
      {
        id: "rango",
        header: "Rango",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.rangoMin} - {row.original.rangoMax}
          </span>
        ),
      },
      { accessorKey: "unidad", header: "Unidad" },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const config = estadoCategoriaConfig[row.original.estado]
          return (
            <Badge variant="outline" className={cn("font-medium", config.className)}>
              {config.label}
            </Badge>
          )
        },
      },
      {
        id: "acciones",
        header: () => <span className="float-right">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${row.original.nombre}`}
              onClick={() => onEditar(row.original.id)}
            >
              <PencilLine className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Eliminar ${row.original.nombre}`}
              onClick={() => onEliminar(row.original.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onEditar, onEliminar],
  )

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3">
        <CardTitle className="text-sm font-semibold">
          Categorías de Edad Activas
        </CardTitle>
        <SlidersHorizontal className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          columns={columnas}
          data={categorias}
          className="rounded-none border-0"
          emptyMessage="No hay categorías de edad configuradas."
        />
      </CardContent>
    </Card>
  )
}
