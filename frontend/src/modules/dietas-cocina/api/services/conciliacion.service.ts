import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import { TAMANO_PAGINA_TABLA } from "@/lib/tamanoPaginaTabla"
import { mapConciliacionList, mapDetalleConciliacionDto, mapKpisConciliacionApi } from "@/modules/dietas-cocina/api/mappers"
import { buildDietasCocinaPath } from "@/modules/dietas-cocina/api/utils"
import type {
  ConciliacionKpisDto,
  DetalleConciliacionDto,
  FilaConciliacionDto,
  MetaPaginacionDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { DetalleConciliacion, FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"

export interface FiltrosConciliacion {
  busqueda?: string
  periodo?: string
  proveedor?: string
  estado?: string
  page?: number
  pageSize?: number
}

export interface ListaConciliacionRespuesta {
  filas: FilaConciliacion[]
  meta: MetaPaginacionDto | null
}

export async function listarConciliacion(
  filtros: FiltrosConciliacion = {},
): Promise<ListaConciliacionRespuesta> {
  const { data } = await apiClient.get<
    ApiResponse<FilaConciliacionDto[]> & { meta?: MetaPaginacionDto; count?: number }
  >(buildDietasCocinaPath("/conciliacion"), {
    params: {
      busqueda: filtros.busqueda,
      periodo: filtros.periodo,
      proveedor: filtros.proveedor,
      estado: filtros.estado,
      page: filtros.page ?? 1,
      pageSize: filtros.pageSize ?? TAMANO_PAGINA_TABLA,
    },
  })
  return {
    filas: mapConciliacionList(data.data),
    meta: data.meta ?? null,
  }
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
