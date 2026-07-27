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
  return {
    desde: filtros.desde,
    hasta: filtros.hasta,
    ...(filtros.servicio ? { servicio: filtros.servicio } : {}),
    ...(filtros.horario ? { horario: filtros.horario } : {}),
    ...(filtros.comida ? { comida: mapearComidaApi(filtros.comida) } : {}),
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
