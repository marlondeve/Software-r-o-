import { useEffect } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { obtenerPermisosRoles } from "@/modules/dietas-cocina/api/services/usuarios.service"
import { establecerMatrizPermisosApi } from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import { EVENTOS_DIETAS_COCINA } from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"
import { suscribirEventosDietasCocina } from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"

/** Precarga la matriz de permisos al entrar al módulo (API activa). */
export function CargarPermisosRolesModulo() {
  const apiActiva = usarApiDietasCocina()

  useEffect(() => {
    if (!apiActiva) return
    const cargar = () => {
      void obtenerPermisosRoles()
        .then(establecerMatrizPermisosApi)
        .catch(() => establecerMatrizPermisosApi([]))
    }
    cargar()
    return suscribirEventosDietasCocina((evento) => {
      if (evento.tipo === EVENTOS_DIETAS_COCINA.PermisosActualizados) cargar()
    })
  }, [apiActiva])

  return null
}
