import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import { mapConciliacionList, mapDetalleConciliacionDto, mapKpisConciliacionApi } from "@/modules/dietas-cocina/api/mappers"
import { buildDietasCocinaPath } from "@/modules/dietas-cocina/api/utils"
import type {
  ConciliacionKpisDto,
  DetalleConciliacionDto,
  FilaConciliacionDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { DetalleConciliacion, FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"

export interface FiltrosConciliacion {
  busqueda?: string
  periodo?: string
  proveedor?: string
  estado?: string
}

export async function listarConciliacion(
  filtros: FiltrosConciliacion = {},
): Promise<FilaConciliacion[]> {
  const { data } = await apiClient.get<ApiResponse<FilaConciliacionDto[]>>(
    buildDietasCocinaPath("/conciliacion"),
    { params: filtros },
  )
  return mapConciliacionList(data.data)
}

export async function obtenerDetalleConciliacionApi(id: string): Promise<DetalleConciliacion> {
  const { data } = await apiClient.get<ApiResponse<DetalleConciliacionDto>>(
    buildDietasCocinaPath(`/conciliacion/${id}`),
  )
  return mapDetalleConciliacionDto(data.data)
}

export async function marcarConciliado(id: string): Promise<FilaConciliacion> {
  const { data } = await apiClient.patch<ApiResponse<FilaConciliacionDto>>(
    buildDietasCocinaPath(`/conciliacion/${id}/conciliado`),
  )
  return mapConciliacionList([data.data])[0]!
}

export async function marcarPendienteRevision(id: string): Promise<FilaConciliacion> {
  const { data } = await apiClient.patch<ApiResponse<FilaConciliacionDto>>(
    buildDietasCocinaPath(`/conciliacion/${id}/pendiente-revision`),
  )
  return mapConciliacionList([data.data])[0]!
}

export async function obtenerKpisConciliacion(
  periodo?: string,
  proveedor?: string,
): Promise<ReturnType<typeof mapKpisConciliacionApi>> {
  const { data } = await apiClient.get<ApiResponse<ConciliacionKpisDto[]>>(
    buildDietasCocinaPath("/conciliacion/kpis"),
    { params: { periodo, proveedor } },
  )
  return mapKpisConciliacionApi(data.data)
}

export async function obtenerDetalleConciliacionSafe(id: string): Promise<DetalleConciliacion | null> {
  try {
    return await obtenerDetalleConciliacionApi(id)
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) return null
    throw error
  }
}
