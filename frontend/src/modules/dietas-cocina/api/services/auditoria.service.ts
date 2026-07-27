import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  mapAuditoriaList,
  mapDetalleAuditoriaDto,
} from "@/modules/dietas-cocina/api/mappers"
import { buildDietasCocinaPath } from "@/modules/dietas-cocina/api/utils"
import type {
  DetalleAuditoriaDto,
  FilaAuditoriaDto,
  MetaPaginacionDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { DetalleAuditoria, FilaAuditoria } from "@/modules/dietas-cocina/types/audit"

export interface FiltrosAuditoria {
  modulo?: string
  resultado?: string
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

export async function listarAuditoria(
  filtros: FiltrosAuditoria = {},
): Promise<ListadoAuditoriaResult> {
  const { data } = await apiClient.get<
    ApiResponse<FilaAuditoriaDto[] | { items: FilaAuditoriaDto[]; meta?: MetaPaginacionDto }>
  >(buildDietasCocinaPath("/auditoria"), { params: filtros })

  const payload = data.data
  if (Array.isArray(payload)) {
    return { filas: mapAuditoriaList(payload) }
  }
  const items = payload?.items ?? []
  return { filas: mapAuditoriaList(items), meta: payload?.meta }
}

export async function obtenerDetalleAuditoria(id: string): Promise<DetalleAuditoria> {
  const { data } = await apiClient.get<ApiResponse<DetalleAuditoriaDto>>(
    buildDietasCocinaPath(`/auditoria/${id}`),
  )
  return mapDetalleAuditoriaDto(data.data)
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
