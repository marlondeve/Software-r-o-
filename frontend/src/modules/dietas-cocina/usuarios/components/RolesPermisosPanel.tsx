import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import { ROLES_DIETAS } from "@/lib/configAccesoModulos"
import {
  PermisosRolPopover,
  PermisosRolResumen,
} from "@/modules/dietas-cocina/usuarios/components/PermisosRolPopover"
import { UsuarioRolBadge } from "@/modules/dietas-cocina/usuarios/components/UsuarioRolBadge"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"

interface RolPermisoFila {
  id: string
  rol: RolDietas
  total: number
}

export function RolesPermisosPanel() {
  const { config } = useConfigAccesoModulos()

  const filasRoles = useMemo<RolPermisoFila[]>(
    () =>
      ROLES_DIETAS.map((rol) => ({
        id: rol,
        rol,
        total: config.permisosDietas[rol]?.length ?? 0,
      })),
    [config],
  )

  const columnas = useMemo<ColumnDef<RolPermisoFila>[]>(
    () => [
      {
        accessorKey: "rol",
        header: "Rol",
        cell: ({ row }) => <UsuarioRolBadge rol={row.original.rol} />,
      },
      {
        id: "secciones",
        header: "Secciones del módulo",
        cell: ({ row }) => <PermisosRolResumen rol={row.original.rol} />,
      },
      {
        accessorKey: "total",
        header: () => <span className="float-right">Total</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="outline">{row.original.total}</Badge>
          </div>
        ),
      },
      {
        id: "acciones",
        header: () => <span className="float-right">Acciones</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <PermisosRolPopover rol={row.original.rol} />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-0">
        <DataTable
          columns={columnas}
          data={filasRoles}
          className="rounded-none border-0"
        />
      </CardContent>
    </Card>
  )
}
