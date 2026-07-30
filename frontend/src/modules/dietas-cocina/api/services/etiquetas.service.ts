import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import { extraerCodigoDesdeQr } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"
import { mapEtiquetaDtoToDomain, mapEtiquetaList, deduplicarEtiquetasPorFila } from "@/modules/dietas-cocina/api/mappers"
import {
  buildDietasCocinaPath,
  extraerCuerpoApi,
  mapearComidaApi,
} from "@/modules/dietas-cocina/api/utils"
import type {
  BulkEtiquetasRequestDto,
  EtiquetaDto,
  GenerarEtiquetasRequestDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

export interface FiltrosEtiquetas {
  comida?: TiempoComida
  estadoLogistica?: string
  pabellon?: string
}

export async function listarEtiquetas(
  filtros: FiltrosEtiquetas = {},
): Promise<EtiquetaEnfermera[]> {
  const params: Record<string, string> = {}
  if (filtros.comida) params.comida = mapearComidaApi(filtros.comida)
  if (filtros.estadoLogistica) params.estadoLogistica = filtros.estadoLogistica
  if (filtros.pabellon) params.pabellon = filtros.pabellon

  const { data } = await apiClient.get<EtiquetaDto[] | ApiResponse<EtiquetaDto[]>>(
    buildDietasCocinaPath("/etiquetas"),
    { params },
  )
  return mapEtiquetaList(extraerCuerpoApi(data))
}

export async function buscarEtiquetaPorCodigo(codigo: string): Promise<EtiquetaEnfermera> {
  const codigoNormalizado = extraerCodigoDesdeQr(codigo)
  const { data } = await apiClient.get<EtiquetaDto | ApiResponse<EtiquetaDto>>(
    buildDietasCocinaPath("/etiquetas/buscar"),
    { params: { codigo: codigoNormalizado } },
  )
  return mapEtiquetaDtoToDomain(extraerCuerpoApi(data))
}

export async function generarEtiquetas(
  body: GenerarEtiquetasRequestDto = {},
): Promise<EtiquetaEnfermera[]> {
  const { data } = await apiClient.post<{
    etiquetaIds?: string[]
    EtiquetaIds?: string[]
    totalGeneradas?: number
  } | ApiResponse<{
    etiquetaIds?: string[]
    EtiquetaIds?: string[]
    totalGeneradas?: number
  }>>(buildDietasCocinaPath("/etiquetas/generar"), body)

  const payload = extraerCuerpoApi(data)
  const idsGenerados = (payload.etiquetaIds ?? payload.EtiquetaIds ?? []).map(String)
  const etiquetas = deduplicarEtiquetasPorFila(await listarEtiquetas())

  if (idsGenerados.length > 0) {
    const idsSet = new Set(idsGenerados)
    const porId = etiquetas.filter((etiqueta) => idsSet.has(etiqueta.id))
    if (porId.length > 0) return porId
  }

  const ordenIds = (body.ordenIds ?? []).map(String)
  if (ordenIds.length > 0) {
    const ordenSet = new Set(ordenIds)
    const porOrden = etiquetas.filter(
      (etiqueta) => etiqueta.ordenCocinaId && ordenSet.has(etiqueta.ordenCocinaId),
    )
    if (porOrden.length > 0) return porOrden
  }

  if (idsGenerados.length > 0) {
    throw new Error(
      "Las etiquetas se generaron en el servidor, pero no se pudieron sincronizar en pantalla. Actualiza la página.",
    )
  }

  return etiquetas
}

export async function marcarEtiquetasImpresas(etiquetaIds: string[]): Promise<void> {
  const body: BulkEtiquetasRequestDto = { etiquetaIds }
  await apiClient.patch(buildDietasCocinaPath("/etiquetas/bulk/impresas"), body)
}

export async function marcarEtiquetasReimpresas(etiquetaIds: string[]): Promise<void> {
  const body: BulkEtiquetasRequestDto = { etiquetaIds }
  await apiClient.patch(buildDietasCocinaPath("/etiquetas/bulk/reimpresas"), body)
}

export async function confirmarPreEntregaEtiqueta(
  etiquetaId: string,
  recibidoPor?: string,
): Promise<EtiquetaEnfermera> {
  const { data } = await apiClient.patch<EtiquetaDto | ApiResponse<EtiquetaDto>>(
    buildDietasCocinaPath(`/etiquetas/${etiquetaId}/pre-entrega`),
    recibidoPor ? { recibidoPor } : {},
  )
  return mapEtiquetaDtoToDomain(extraerCuerpoApi(data))
}

export async function confirmarEntregaEtiqueta(etiquetaId: string): Promise<EtiquetaEnfermera> {
  const { data } = await apiClient.patch<EtiquetaDto | ApiResponse<EtiquetaDto>>(
    buildDietasCocinaPath(`/etiquetas/${etiquetaId}/entrega`),
  )
  return mapEtiquetaDtoToDomain(extraerCuerpoApi(data))
}

export async function registrarDevolucionEtiqueta(
  etiquetaId: string,
  payload: Record<string, unknown> = {},
): Promise<EtiquetaEnfermera> {
  const { data } = await apiClient.patch<EtiquetaDto | ApiResponse<EtiquetaDto>>(
    buildDietasCocinaPath(`/etiquetas/${etiquetaId}/devolucion`),
    payload,
  )
  return mapEtiquetaDtoToDomain(extraerCuerpoApi(data))
}

export async function subirFotoDevolucion(
  etiquetaId: string,
  archivo: File,
): Promise<void> {
  const formData = new FormData()
  formData.append("archivo", archivo)
  await apiClient.post(
    buildDietasCocinaPath(`/etiquetas/${etiquetaId}/foto-devolucion`),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  )
}

export async function descargarPdfEtiquetas(params?: Record<string, string>): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(buildDietasCocinaPath("/etiquetas/pdf"), {
    params,
    responseType: "blob",
  })
  return data
}

export async function buscarEtiquetaPorCodigoSafe(
  codigo: string,
): Promise<EtiquetaEnfermera | null> {
  try {
    return await buscarEtiquetaPorCodigo(codigo)
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) return null
    throw error
  }
}
