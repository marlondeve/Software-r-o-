import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import { buildDietasCocinaPath, mapearComidaApi } from "@/modules/dietas-cocina/api/utils"
import type { ReporteDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

export interface FiltrosReportes {
  desde: string
  hasta: string
  servicio?: string
  horario?: string
  comida?: TiempoComida
}

function paramsReporte(filtros: FiltrosReportes): Record<string, string> {
  const turno =
    filtros.horario && filtros.horario !== "todos"
      ? filtros.horario
      : filtros.comida
  return {
    desde: filtros.desde,
    hasta: filtros.hasta,
    ...(filtros.servicio && filtros.servicio !== "todos"
      ? { servicio: filtros.servicio }
      : {}),
    ...(turno && turno !== "todos"
      ? { comida: mapearComidaApi(turno as TiempoComida), horario: turno }
      : {}),
  }
}

export async function obtenerReporteNutricionista(
  filtros: FiltrosReportes,
): Promise<ReporteDto> {
  const { data } = await apiClient.get<ApiResponse<ReporteDto>>(
    buildDietasCocinaPath("/reportes/nutricionista"),
    { params: paramsReporte(filtros) },
  )
  return data.data ?? {}
}

export async function obtenerReporteProveedor(filtros: FiltrosReportes): Promise<ReporteDto> {
  const { data } = await apiClient.get<ApiResponse<ReporteDto>>(
    buildDietasCocinaPath("/reportes/proveedor"),
    { params: paramsReporte(filtros) },
  )
  return data.data ?? {}
}
