import type { RolDietas } from "@/modules/dietas-cocina/types/enums"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import { ROLES_DIETAS } from "@/lib/configAccesoModulos"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { obtenerPermisosRoles } from "@/modules/dietas-cocina/api/services/usuarios.service"
import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import {
  EditarPermisosRolDialog,
} from "@/modules/dietas-cocina/usuarios/components/EditarPermisosRolDialog"
import { PermisosRolResumen } from "@/modules/dietas-cocina/usuarios/components/PermisosRolPopover"
import { UsuarioRolBadge } from "@/modules/dietas-cocina/usuarios/components/UsuarioRolBadge"
import { contarPermisosActivos } from "@/modules/dietas-cocina/usuarios/lib/permisosApiBridge"

interface RolPermisoFila {
  id: string
  rol: RolDietas
  total: number
}

interface RolesPermisosPanelProps {
  puedeGestionar: boolean
}

export function RolesPermisosPanel({ puedeGestionar }: RolesPermisosPanelProps) {
  const apiActiva = usarApiDietasCocina()
  const { config } = useConfigAccesoModulos()
  const [permisosApi, setPermisosApi] = useState<PermisoRolDto[]>([])

  useEffect(() => {
    if (!apiActiva) return
    void obtenerPermisosRoles()
      .then(setPermisosApi)
      .catch(() => setPermisosApi([]))
  }, [apiActiva])

  const filasRoles = useMemo<RolPermisoFila[]>(
    () =>
      ROLES_DIETAS.map((rol) => ({
        id: rol,
        rol,
        total: apiActiva
          ? contarPermisosActivos(
              permisosApi.find((entry) => entry.rol === rol)?.permisos,
            )
          : config.permisosDietas[rol]?.length ?? 0,
      })),
    [apiActiva, config.permisosDietas, permisosApi],
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
        cell: ({ row }) => (
          <PermisosRolResumen
            rol={row.original.rol}
            permisosApi={apiActiva ? permisosApi : undefined}
          />
        ),
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
            <EditarPermisosRolDialog
              rol={row.original.rol}
              puedeGestionar={puedeGestionar}
              apiActiva={apiActiva}
              permisosApi={permisosApi}
              onPermisosActualizados={setPermisosApi}
            />
          </div>
        ),
      },
    ],
    [apiActiva, permisosApi, puedeGestionar],
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
