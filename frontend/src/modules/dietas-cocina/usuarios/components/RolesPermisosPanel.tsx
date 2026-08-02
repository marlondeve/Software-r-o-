import type { RolModuloDto, PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  listarRoles,
  obtenerPermisosRoles,
} from "@/modules/dietas-cocina/api/services/usuarios.service"
import { establecerMatrizPermisosApi } from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import { RolAccionesCell } from "@/modules/dietas-cocina/usuarios/components/RolAccionesCell"
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
  onRolesChanged?: () => void
}

const GRID_ROLES =
  "grid gap-x-4 gap-y-3 px-4 py-3 lg:grid-cols-[11rem_minmax(0,1fr)_4.5rem_7.5rem] lg:items-start"

export function RolesPermisosPanel({
  puedeGestionar,
  refresco = 0,
  onRolesChanged,
}: RolesPermisosPanelProps) {
  const apiActiva = usarApiDietasCocina()
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

  const recargarRoles = useCallback(() => {
    cargarRoles()
    onRolesChanged?.()
  }, [cargarRoles, onRolesChanged])

  useEffect(() => {
    cargarRoles()
  }, [cargarRoles, refresco])

  const filasRoles = useMemo<RolPermisoFila[]>(() => {
    if (!apiActiva) return []

    return rolesApi.map((rol) => ({
      id: rol.id ?? "",
      nombre: rol.nombre ?? "",
      esSistema: rol.esSistema ?? false,
      total: rol.totalPermisos ?? 0,
    }))
  }, [apiActiva, rolesApi])

  const nombresRoles = useMemo(
    () => filasRoles.map((rol) => rol.nombre),
    [filasRoles],
  )

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-0">
        <div className="rounded-lg border border-border">
          <div
            className={`${GRID_ROLES} hidden border-b bg-muted/30 text-sm font-medium text-foreground lg:grid`}
          >
            <div>Rol</div>
            <div>Secciones del módulo</div>
            <div className="text-right">Total</div>
            <div className="text-right">Acciones</div>
          </div>

          {filasRoles.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Sin roles configurados.
            </p>
          ) : (
            filasRoles.map((rol) => {
              const total =
                apiActiva
                  ? rol.total
                  : contarPermisosActivos(
                      permisosApi.find((entry) => entry.rol === rol.nombre)?.permisos,
                    ) || rol.total

              return (
                <div
                  key={rol.id}
                  className={`${GRID_ROLES} border-b border-border last:border-b-0`}
                >
                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground lg:hidden">
                      Rol
                    </p>
                    <UsuarioRolBadge rol={rol.nombre} />
                  </div>

                  <div className="min-w-0 lg:col-start-auto">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground lg:hidden">
                      Secciones del módulo
                    </p>
                    <PermisosRolResumen
                      rol={rol.nombre}
                      permisosApi={apiActiva ? permisosApi : undefined}
                    />
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end">
                    <span className="text-xs font-medium text-muted-foreground lg:hidden">
                      Total
                    </span>
                    <Badge variant="outline" className="tabular-nums">
                      {total}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-start lg:justify-end">
                    <RolAccionesCell
                      rolId={rol.id}
                      rolNombre={rol.nombre}
                      esSistema={rol.esSistema}
                      puedeGestionar={puedeGestionar}
                      apiActiva={apiActiva}
                      permisosApi={permisosApi}
                      nombresExistentes={nombresRoles}
                      onRolesActualizados={recargarRoles}
                      onPermisosActualizados={(permisos) => {
                        setPermisosApi(permisos)
                        establecerMatrizPermisosApi(permisos)
                        recargarRoles()
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
