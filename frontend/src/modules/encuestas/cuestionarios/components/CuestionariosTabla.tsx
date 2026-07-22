import { useMemo } from "react"
import { Phone, UserCheck, Users } from "lucide-react"

import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { CuestionarioAccionesPopover } from "@/modules/encuestas/cuestionarios/components/CuestionarioAccionesPopover"
import { EstadoCuestionarioBadge } from "@/modules/encuestas/cuestionarios/components/EstadoCuestionarioBadge"
import type { Cuestionario } from "@/modules/encuestas/cuestionarios/datos/mockCuestionarios"

const CANAL_LABEL: Record<Cuestionario["canal"], { label: string; icon: typeof Phone }> = {
  presencial: { label: "Presencial", icon: UserCheck },
  telefonico: { label: "Telefónico", icon: Phone },
  ambos: { label: "Ambos canales", icon: Users },
}

interface CuestionariosTablaProps {
  cuestionarios: Cuestionario[]
  onEditar: (cuestionario: Cuestionario) => void
  onVerPreguntas: (cuestionario: Cuestionario) => void
  onDuplicar: (cuestionario: Cuestionario) => void
  onToggleEstado: (cuestionario: Cuestionario) => void
  onEliminar: (cuestionario: Cuestionario) => void
}

export function CuestionariosTabla({
  cuestionarios,
  onEditar,
  onVerPreguntas,
  onDuplicar,
  onToggleEstado,
  onEliminar,
}: CuestionariosTablaProps) {
  const columnas = useMemo<ColumnDef<Cuestionario>[]>(
    () => [
      {
        id: "nombre",
        header: "Cuestionario",
        cell: ({ row }) => (
          <div className="max-w-xs">
            <p className="font-medium text-foreground">{row.original.nombre}</p>
            <p className="text-xs text-muted-foreground">{row.original.descripcion}</p>
          </div>
        ),
      },
      {
        id: "canal",
        header: "Canal",
        cell: ({ row }) => {
          const { label, icon: Icon } = CANAL_LABEL[row.original.canal]
          return (
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Icon className="size-3.5 text-muted-foreground" />
              {label}
            </span>
          )
        },
      },
      {
        accessorKey: "preguntas",
        header: () => <div className="text-center">Preguntas</div>,
        cell: ({ row }) => (
          <div className="text-center tabular-nums text-foreground">
            {row.original.preguntas}
          </div>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => <EstadoCuestionarioBadge estado={row.original.estado} />,
      },
      {
        accessorKey: "actualizadoEn",
        header: "Última actualización",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.actualizadoEn}</span>
        ),
      },
      {
        id: "acciones",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <CuestionarioAccionesPopover
              cuestionario={row.original}
              onEditar={onEditar}
              onVerPreguntas={onVerPreguntas}
              onDuplicar={onDuplicar}
              onToggleEstado={onToggleEstado}
              onEliminar={onEliminar}
            />
          </div>
        ),
      },
    ],
    [onEditar, onVerPreguntas, onDuplicar, onToggleEstado, onEliminar],
  )

  return (
    <DataTable
      columns={columnas}
      data={cuestionarios}
      emptyMessage="No hay cuestionarios que coincidan con los filtros."
    />
  )
}
