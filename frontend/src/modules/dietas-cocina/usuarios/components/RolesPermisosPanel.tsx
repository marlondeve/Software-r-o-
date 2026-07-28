import type { RolModuloDto, PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import { ROLES_DIETAS } from "@/lib/configAccesoModulos"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  listarRoles,
  obtenerPermisosRoles,
} from "@/modules/dietas-cocina/api/services/usuarios.service"
import { establecerMatrizPermisosApi } from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import {
  EditarPermisosRolDialog,
} from "@/modules/dietas-cocina/usuarios/components/EditarPermisosRolDialog"
import { PermisosRolResumen } from "@/modules/dietas-cocina/usuarios/components/PermisosRolPopover"
import { UsuarioRolBadge } from "@/modules/dietas-cocina/usuarios/components/UsuarioRolBadge"
import { contarPermisosActivos } from "@/modules/dietas-cocina/usuarios/lib/permisosApiBridge"

interface RolPermisoFila {
  id: string
  nombre: string
  esSistema: boolean
  total: number
}

interface RolesPermisosPanelProps {
  puedeGestionar: boolean
  refresco?: number
}

export function RolesPermisosPanel({
  puedeGestionar,
  refresco = 0,
}: RolesPermisosPanelProps) {
  const apiActiva = usarApiDietasCocina()
  const { config } = useConfigAccesoModulos()
  const [rolesApi, setRolesApi] = useState<RolModuloDto[]>([])
  const [permisosApi, setPermisosApi] = useState<PermisoRolDto[]>([])

  const cargarRoles = useCallback(() => {
    if (!apiActiva) return
    void Promise.all([listarRoles(), obtenerPermisosRoles()])
      .then(([roles, permisos]) => {
        setRolesApi(roles)
        setPermisosApi(permisos)
        establecerMatrizPermisosApi(permisos)
      })
      .catch(() => {
        setRolesApi([])
        setPermisosApi([])
      })
  }, [apiActiva])

  useEffect(() => {
    cargarRoles()
  }, [cargarRoles, refresco])

  const filasRoles = useMemo<RolPermisoFila[]>(() => {
    if (apiActiva) {
      return rolesApi.map((rol) => ({
        id: rol.id ?? "",
        nombre: rol.nombre ?? "",
        esSistema: rol.esSistema ?? false,
        total: rol.totalPermisos ?? 0,
      }))
    }

    return ROLES_DIETAS.map((rol) => ({
      id: rol,
      nombre: rol,
      esSistema: true,
      total: config.permisosDietas[rol]?.length ?? 0,
    }))
  }, [apiActiva, config.permisosDietas, rolesApi])

  const columnas = useMemo<ColumnDef<RolPermisoFila>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: "Rol",
        cell: ({ row }) => <UsuarioRolBadge rol={row.original.nombre} />,
      },
      {
        id: "secciones",
        header: "Secciones del módulo",
        cell: ({ row }) => (
          <PermisosRolResumen
            rol={row.original.nombre}
            permisosApi={apiActiva ? permisosApi : undefined}
          />
        ),
      },
      {
        accessorKey: "total",
        header: () => <span className="float-right">Total</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="outline">
              {apiActiva
                ? row.original.total
                : contarPermisosActivos(
                    permisosApi.find((entry) => entry.rol === row.original.nombre)?.permisos,
                  ) || row.original.total}
            </Badge>
          </div>
        ),
      },
      {
        id: "acciones",
        header: () => <span className="float-right">Acciones</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <EditarPermisosRolDialog
              rolId={row.original.id}
              rolNombre={row.original.nombre}
              puedeGestionar={puedeGestionar}
              apiActiva={apiActiva}
              permisosApi={permisosApi}
              onPermisosActualizados={(permisos) => {
                setPermisosApi(permisos)
                establecerMatrizPermisosApi(permisos)
                cargarRoles()
              }}
            />
          </div>
        ),
      },
    ],
    [apiActiva, permisosApi, puedeGestionar, cargarRoles],
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
