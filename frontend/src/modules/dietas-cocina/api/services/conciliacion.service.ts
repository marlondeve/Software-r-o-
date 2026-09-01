import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  mapConciliacionList,
  mapDetalleConciliacionDto,
  mapKpisConciliacionApi,
} from "@/modules/dietas-cocina/api/mappers"
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
  desde?: string
  hasta?: string
  periodo?: string
  estado?: string
  numeroFactura?: string
  page?: number
  pageSize?: number
}

export interface ListaConciliacionRespuesta {
  filas: FilaConciliacion[]
  meta: MetaPaginacionDto | null
  kpis?: ReturnType<typeof mapKpisConciliacionApi>
}

export async function listarConciliacion(
  filtros: FiltrosConciliacion = {},
): Promise<ListaConciliacionRespuesta> {
  const { data } = await apiClient.get<
    ApiResponse<FilaConciliacionDto[]> & {
      meta?: MetaPaginacionDto
      kpis?: ConciliacionKpisDto[]
    }
  >(buildDietasCocinaPath("/conciliacion"), {
    params: {
      busqueda: filtros.busqueda,
      desde: filtros.desde,
      hasta: filtros.hasta,
      periodo: filtros.periodo,
      estado: filtros.estado,
      numeroFactura: filtros.numeroFactura,
      page: filtros.page ?? 1,
      pageSize: filtros.pageSize ?? 50,
    },
  })
  return {
    filas: mapConciliacionList(data.data),
    meta: data.meta ?? null,
    kpis: data.kpis ? mapKpisConciliacionApi(data.kpis) : undefined,
  }
}

export async function obtenerDetalleConciliacionApi(
  id: string,
  desde?: string,
  hasta?: string,
): Promise<DetalleConciliacion> {
  const { data } = await apiClient.get<ApiResponse<DetalleConciliacionDto>>(
    buildDietasCocinaPath(`/conciliacion/${id}`),
    { params: { desde, hasta } },
  )
  return mapDetalleConciliacionDto(data.data)
}

export async function marcarConciliado(
  id: string,
  motivo: string,
  observaciones: string,
): Promise<FilaConciliacion> {
  const { data } = await apiClient.patch<ApiResponse<FilaConciliacionDto>>(
    buildDietasCocinaPath(`/conciliacion/${id}/conciliado`),
    { motivo, observaciones },
  )
  return mapConciliacionList([data.data])[0]!
}

export async function marcarPendienteRevision(
  id: string,
  motivo: string,
  observaciones?: string,
): Promise<FilaConciliacion> {
  const { data } = await apiClient.patch<ApiResponse<FilaConciliacionDto>>(
    buildDietasCocinaPath(`/conciliacion/${id}/pendiente-revision`),
    { motivo, observaciones },
  )
  return mapConciliacionList([data.data])[0]!
}

export async function obtenerKpisConciliacion(
  desde?: string,
  hasta?: string,
): Promise<ReturnType<typeof mapKpisConciliacionApi>> {
  const { data } = await apiClient.get<ApiResponse<ConciliacionKpisDto[]>>(
    buildDietasCocinaPath("/conciliacion/kpis"),
    { params: { desde, hasta } },
  )
  return mapKpisConciliacionApi(data.data)
}

export async function exportarConciliacionCsv(filtros: FiltrosConciliacion = {}): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(buildDietasCocinaPath("/conciliacion"), {
    params: {
      busqueda: filtros.busqueda,
      desde: filtros.desde,
      hasta: filtros.hasta,
      estado: filtros.estado,
      numeroFactura: filtros.numeroFactura,
      formato: "csv",
    },
    responseType: "blob",
  })
  return data
}

export interface LineaPlanillaCocina {
  comida: string
  lineaFcr: string
  cantidad: number
}

export async function guardarCantidadesCocina(opts: {
  desde?: string
  hasta?: string
  numeroFactura?: string
  lineas: LineaPlanillaCocina[]
}): Promise<ListaConciliacionRespuesta> {
  const { data } = await apiClient.post<
    ApiResponse<FilaConciliacionDto[]> & { meta?: MetaPaginacionDto }
  >(buildDietasCocinaPath("/conciliacion/planilla"), {
    desde: opts.desde,
    hasta: opts.hasta,
    numeroFactura: opts.numeroFactura,
    lineas: opts.lineas.map((linea) => ({
      comida: linea.comida,
      lineaFcr: linea.lineaFcr,
      cantidad: linea.cantidad,
    })),
  })
  return {
    filas: mapConciliacionList(data.data),
    meta: data.meta ?? null,
  }
}

export async function cargarPlanillaCsv(opts: {
  archivo: File
  desde?: string
  hasta?: string
  numeroFactura?: string
}): Promise<ListaConciliacionRespuesta> {
  const form = new FormData()
  form.append("planilla", opts.archivo)
  const { data } = await apiClient.post<
    ApiResponse<FilaConciliacionDto[]> & { meta?: MetaPaginacionDto }
  >(buildDietasCocinaPath("/conciliacion/planilla/csv"), form, {
    params: {
      desde: opts.desde,
      hasta: opts.hasta,
      numeroFactura: opts.numeroFactura,
    },
    headers: { "Content-Type": "multipart/form-data" },
  })
  return {
    filas: mapConciliacionList(data.data),
    meta: data.meta ?? null,
  }
}

export async function subirFacturaPeriodo(opts: {
  archivo: File
  desde?: string
  hasta?: string
  numeroFactura?: string
}): Promise<void> {
  const form = new FormData()
  form.append("factura", opts.archivo)
  await apiClient.post(buildDietasCocinaPath("/conciliacion/factura"), form, {
    params: {
      desde: opts.desde,
      hasta: opts.hasta,
      numeroFactura: opts.numeroFactura,
    },
    headers: { "Content-Type": "multipart/form-data" },
  })
}

export async function obtenerDetalleConciliacionSafe(
  id: string,
  desde?: string,
  hasta?: string,
): Promise<DetalleConciliacion | null> {
  try {
    return await obtenerDetalleConciliacionApi(id, desde, hasta)
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) return null
    throw error
  }
}
