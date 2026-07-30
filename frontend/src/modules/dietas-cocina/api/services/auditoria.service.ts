import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  mapAuditoriaList,
  mapDetalleAuditoriaDto,
} from "@/modules/dietas-cocina/api/mappers"
import { buildDietasCocinaPath } from "@/modules/dietas-cocina/api/utils"
import { construirParamsAuditoriaApi } from "@/modules/dietas-cocina/auditoria/lib/auditoriaFiltrosApi"
import type {
  DetalleAuditoriaDto,
  FilaAuditoriaDto,
  MetaPaginacionDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { DetalleAuditoria, FilaAuditoria } from "@/modules/dietas-cocina/types/audit"

export interface FiltrosAuditoria {
  modulo?: string
  moduloUi?: string
  resultado?: string
  resultadoUi?: string
  desde?: string
  hasta?: string
  usuario?: string
  page?: number
  pageSize?: number
}

export interface ListadoAuditoriaResult {
  filas: FilaAuditoria[]
  meta?: MetaPaginacionDto
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizarMeta(raw: unknown): MetaPaginacionDto | undefined {
  const meta = asRecord(raw)
  if (!meta) return undefined
  return {
    page: Number(meta.page ?? meta.Page ?? 1),
    pageSize: Number(meta.pageSize ?? meta.PageSize ?? 20),
    total: Number(meta.total ?? meta.Total ?? 0),
    totalPages: Number(meta.totalPages ?? meta.TotalPages ?? 1),
  }
}

function parseListadoAuditoria(payload: unknown): ListadoAuditoriaResult {
  const registro = asRecord(payload)
  if (!registro) return { filas: [] }

  const dataRaw = registro.data ?? registro.Data ?? registro.items ?? registro.Items
  const meta = normalizarMeta(registro.meta ?? registro.Meta)

  if (Array.isArray(dataRaw)) {
    return { filas: mapAuditoriaList(dataRaw as FilaAuditoriaDto[]), meta }
  }

  const anidado = asRecord(dataRaw)
  if (anidado) {
    const items = anidado.data ?? anidado.Data ?? anidado.items ?? anidado.Items
    return {
      filas: mapAuditoriaList(items as FilaAuditoriaDto[]),
      meta: normalizarMeta(anidado.meta ?? anidado.Meta) ?? meta,
    }
  }

  return { filas: [], meta }
}

export async function listarAuditoria(
  filtros: FiltrosAuditoria = {},
): Promise<ListadoAuditoriaResult> {
  const { data } = await apiClient.get<unknown>(buildDietasCocinaPath("/auditoria"), {
    params: construirParamsAuditoriaApi(filtros),
  })

  return parseListadoAuditoria(data)
}

export async function exportarAuditoriaCsvApi(
  filtros: FiltrosAuditoria = {},
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(buildDietasCocinaPath("/auditoria"), {
    params: { ...construirParamsAuditoriaApi(filtros), formato: "csv" },
    responseType: "blob",
  })
  return data
}

export async function obtenerDetalleAuditoria(id: string): Promise<DetalleAuditoria> {
  const { data } = await apiClient.get<ApiResponse<DetalleAuditoriaDto>>(
    buildDietasCocinaPath(`/auditoria/${id}`),
  )
  const cuerpo = (data as { data?: DetalleAuditoriaDto }).data ?? data
  return mapDetalleAuditoriaDto(cuerpo as DetalleAuditoriaDto)
}

export async function obtenerDetalleAuditoriaSafe(
  id: string,
): Promise<DetalleAuditoria | null> {
  try {
    return await obtenerDetalleAuditoria(id)
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) return null
    throw error
  }
}
