import { useMemo } from "react"

import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { UsuarioAccionesPopover } from "@/modules/dietas-cocina/usuarios/components/UsuarioAccionesPopover"
import { UsuarioEstadoBadge } from "@/modules/dietas-cocina/usuarios/components/UsuarioEstadoBadge"
import { UsuarioRolBadge } from "@/modules/dietas-cocina/usuarios/components/UsuarioRolBadge"
import type { UsuarioModulo } from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"

interface UsuariosTablaProps {
  usuarios: UsuarioModulo[]
  puedeGestionar: boolean
  onEditar: (usuario: UsuarioModulo) => void
  onCambiarRol: (usuario: UsuarioModulo) => void
  onToggleEstado: (usuario: UsuarioModulo) => void
  onRestablecerClave: (usuario: UsuarioModulo) => void
  onEliminar: (usuario: UsuarioModulo) => void
}

export function UsuariosTabla({
  usuarios,
  puedeGestionar,
  onEditar,
  onCambiarRol,
  onToggleEstado,
  onRestablecerClave,
  onEliminar,
}: UsuariosTablaProps) {
  const columnas = useMemo<ColumnDef<UsuarioModulo>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Nombre
          </span>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => onEditar(row.original)}
          >
            {row.original.nombre}
          </button>
        ),
      },
      {
        accessorKey: "usuario",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Usuario
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.usuario}</span>
        ),
      },
      {
        accessorKey: "correo",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Correo
          </span>
        ),
        cell: ({ row }) => (
          <span className="max-w-10rem truncate text-muted-foreground">
            {row.original.correo}
          </span>
        ),
      },
      {
        accessorKey: "rol",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Rol
          </span>
        ),
        cell: ({ row }) => <UsuarioRolBadge rol={row.original.rol} />,
      },
      {
        accessorKey: "servicioArea",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Servicio/ Área
          </span>
        ),
      },
      {
        id: "orgProveedora",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Org. Proveedora
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.orgProveedora ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Estado
          </span>
        ),
        cell: ({ row }) => (
          <UsuarioEstadoBadge estado={row.original.estado} />
        ),
      },
      {
        accessorKey: "ultimoAcceso",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Último acceso
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.ultimoAcceso}
          </span>
        ),
      },
      {
        accessorKey: "origen",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Origen
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.origen}</span>
        ),
      },
      {
        id: "acciones",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Acciones
          </span>
        ),
        cell: ({ row }) => (
          <UsuarioAccionesPopover
            usuario={row.original}
            puedeGestionar={puedeGestionar}
            onEditar={onEditar}
            onCambiarRol={onCambiarRol}
            onToggleEstado={onToggleEstado}
            onRestablecerClave={onRestablecerClave}
            onEliminar={onEliminar}
          />
        ),
      },
    ],
    [
      puedeGestionar,
      onEditar,
      onCambiarRol,
      onToggleEstado,
      onRestablecerClave,
      onEliminar,
    ],
  )

  return (
    <DataTable
      columns={columnas}
      data={usuarios}
      className="rounded-none border-0"
      emptyMessage="No hay usuarios para los filtros seleccionados."
    />
  )
}
