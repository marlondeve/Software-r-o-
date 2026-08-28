import { useCallback, useEffect, useMemo, useState } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  mapAlertasDashboardApi,
  mapKpisDashboardApi,
} from "@/modules/dietas-cocina/api/mappers/dashboard-view.mapper"
import {
  obtenerDashboardEnfermera,
  obtenerDashboardNutricionista,
  obtenerDashboardProveedor,
} from "@/modules/dietas-cocina/api/services/dashboards.service"
import { EVENTOS_DIETAS_COCINA } from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"
import { useRefetchOnDietasEvento } from "@/modules/dietas-cocina/realtime/useRefetchOnDietasEvento"
import type { DashboardDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

export function useDashboardApi(
  rol: "nutricionista" | "proveedor" | "enfermera",
  comida: TiempoComida = "almuerzo",
  pabellon?: string,
) {
  const apiActiva = usarApiDietasCocina()
  const [data, setData] = useState<DashboardDto | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(
    (mostrarCarga = false) => {
      if (!apiActiva) return
      if (mostrarCarga) setCargando(true)
      setError(null)
      const cargar =
        rol === "nutricionista"
          ? obtenerDashboardNutricionista(comida)
          : rol === "proveedor"
            ? obtenerDashboardProveedor(comida)
            : obtenerDashboardEnfermera(comida, pabellon)

      void cargar
        .then(setData)
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Error al cargar dashboard"),
        )
        .finally(() => {
          if (mostrarCarga) setCargando(false)
        })
    },
    [apiActiva, rol, comida, pabellon],
  )

  useEffect(() => {
    recargar(true)
  }, [recargar])

  useRefetchOnDietasEvento(
    [
      EVENTOS_DIETAS_COCINA.FilaActualizada,
      EVENTOS_DIETAS_COCINA.CensoActualizado,
      EVENTOS_DIETAS_COCINA.OrdenActualizada,
      EVENTOS_DIETAS_COCINA.EtiquetasActualizadas,
      EVENTOS_DIETAS_COCINA.ParametrosActualizados,
      EVENTOS_DIETAS_COCINA.CatalogoActualizado,
    ],
    () => recargar(false),
    apiActiva,
  )

  const kpis = useMemo(() => mapKpisDashboardApi(data?.kpis), [data])

  const actividad = useMemo(
    () =>
      (data?.actividad ?? []).map((a) => ({
        paciente: a.paciente ?? "",
        accion: a.accion ?? "",
        hora: a.hora ?? "",
        estado: (a.estado ?? "guardado") as import("@/modules/dietas-cocina/types/enums").EstadoDieta,
      })),
    [data],
  )

  const alertas = useMemo(() => mapAlertasDashboardApi(data?.alertas), [data])

  return { apiActiva, data, kpis, actividad, alertas, cargando, error }
}
