import { useEffect } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { obtenerPermisosRoles } from "@/modules/dietas-cocina/api/services/usuarios.service"
import { establecerMatrizPermisosApi } from "@/modules/dietas-cocina/lib/permisosMatrizCache"

/** Precarga la matriz de permisos al entrar al módulo (API activa). */
export function CargarPermisosRolesModulo() {
  const apiActiva = usarApiDietasCocina()

  useEffect(() => {
    if (!apiActiva) return
    void obtenerPermisosRoles()
      .then(establecerMatrizPermisosApi)
      .catch(() => establecerMatrizPermisosApi([]))
  }, [apiActiva])

  return null
}
