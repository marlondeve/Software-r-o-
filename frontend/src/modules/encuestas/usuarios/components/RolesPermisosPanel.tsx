import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  PERMISOS_POR_ROL_DEFAULT,
  RUTAS_ENCUESTAS_MODULO,
  type RutaEncuestasModulo,
} from "@/modules/encuestas/lib/permisos"
import { ROLES_ENCUESTAS_MODULO, type RolEncuestas } from "@/modules/encuestas/lib/roles"
import { PermisosRolPopover } from "@/modules/encuestas/usuarios/components/PermisosRolPopover"
import { UsuarioRolBadge } from "@/modules/encuestas/usuarios/components/UsuarioRolBadge"

interface RolPermisoFila {
  id: string
  rol: RolEncuestas
  rutas: RutaEncuestasModulo[]
}

export function RolesPermisosPanel() {
  const [permisos, setPermisos] =
    useState<Record<RolEncuestas, RutaEncuestasModulo[]>>(PERMISOS_POR_ROL_DEFAULT)

  function toggleRuta(rol: RolEncuestas, ruta: RutaEncuestasModulo, activo: boolean) {
    setPermisos((prev) => {
      const rutas = new Set(prev[rol])
      if (activo) rutas.add(ruta)
      else rutas.delete(ruta)
      return { ...prev, [rol]: Array.from(rutas) }
    })
  }

  const filasRoles = useMemo<RolPermisoFila[]>(
    () =>
      ROLES_ENCUESTAS_MODULO.map((rol) => ({
        id: rol,
        rol,
        rutas: permisos[rol] ?? [],
      })),
    [permisos],
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
        cell: ({ row }) => {
          const etiquetas = row.original.rutas
            .map((id) => RUTAS_ENCUESTAS_MODULO.find((ruta) => ruta.id === id)?.label ?? id)
            .join(", ")
          return (
            <span className="text-muted-foreground">
              {etiquetas || "Sin secciones asignadas"}
            </span>
          )
        },
      },
      {
        accessorKey: "rutas",
        header: () => <span className="float-right">Total</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="outline">{row.original.rutas.length}</Badge>
          </div>
        ),
      },
      {
        id: "acciones",
        header: () => <span className="float-right">Acciones</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <PermisosRolPopover
              rol={row.original.rol}
              rutasActivas={row.original.rutas}
              onToggle={(ruta, activo) => toggleRuta(row.original.rol, ruta, activo)}
            />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-0">
        <DataTable columns={columnas} data={filasRoles} className="rounded-none border-0" />
      </CardContent>
    </Card>
  )
}
