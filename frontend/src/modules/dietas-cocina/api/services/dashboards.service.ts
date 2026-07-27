import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  buildDietasCocinaPath,
  fechaOperativaHoy,
  mapearComidaApi,
} from "@/modules/dietas-cocina/api/utils"
import type { DashboardDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

export async function obtenerDashboardNutricionista(
  comida: TiempoComida,
  fecha = fechaOperativaHoy(),
): Promise<DashboardDto> {
  const { data } = await apiClient.get<ApiResponse<DashboardDto>>(
    buildDietasCocinaPath("/dashboard/nutricionista"),
    { params: { fecha, comida: mapearComidaApi(comida) } },
  )
  return data.data ?? {}
}

export async function obtenerDashboardProveedor(
  comida: TiempoComida,
): Promise<DashboardDto> {
  const { data } = await apiClient.get<ApiResponse<DashboardDto>>(
    buildDietasCocinaPath("/dashboard/proveedor"),
    { params: { comida: mapearComidaApi(comida) } },
  )
  return data.data ?? {}
}

export async function obtenerDashboardEnfermera(
  comida: TiempoComida,
  pabellon?: string,
): Promise<DashboardDto> {
  const { data } = await apiClient.get<ApiResponse<DashboardDto>>(
    buildDietasCocinaPath("/dashboard/enfermera"),
    {
      params: {
        comida: mapearComidaApi(comida),
        ...(pabellon ? { pabellon } : {}),
      },
    },
  )
  return data.data ?? {}
}
