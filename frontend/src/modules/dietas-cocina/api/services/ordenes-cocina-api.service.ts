import { apiClient } from "@/api/client"
import type {
  ActualizarChecklistOrdenRequestDto,
  ActualizarEstadoOrdenRequestDto,
  CrearOrdenCocinaRequestDto,
  OrdenCocinaApiDto,
} from "@/modules/dietas-cocina/types/api-dtos"

export interface FiltrosOrdenesCocinaApi {
  fecha?: string
  comida?: string
  estado?: string
}

export async function listarOrdenesCocina(
  filtros: FiltrosOrdenesCocinaApi = {},
): Promise<OrdenCocinaApiDto[]> {
  const { data } = await apiClient.get<OrdenCocinaApiDto[]>("/ordenes-cocina", {
    params: filtros,
  })
  const items = Array.isArray(data) ? data : []
  return items.map((orden) => ({
    ...orden,
    id: String(orden.id),
    dietasIds: (orden.dietasIds ?? (orden as { DietasIds?: string[] }).DietasIds ?? []).map(
      String,
    ),
  }))
}

export async function obtenerDetalleOrdenCocina(
  ordenId: string,
): Promise<OrdenCocinaApiDto> {
  const { data } = await apiClient.get<OrdenCocinaApiDto>(`/ordenes-cocina/${ordenId}`)
  return { ...data, id: String(data.id) }
}

export async function crearOrdenCocina(
  body: CrearOrdenCocinaRequestDto,
): Promise<OrdenCocinaApiDto> {
  const { data } = await apiClient.post<OrdenCocinaApiDto>("/ordenes-cocina", body)
  return { ...data, id: String(data.id) }
}

export async function actualizarEstadoOrdenCocina(
  ordenId: string,
  body: ActualizarEstadoOrdenRequestDto,
): Promise<OrdenCocinaApiDto> {
  const { data } = await apiClient.patch<OrdenCocinaApiDto>(
    `/ordenes-cocina/${ordenId}/estado`,
    body,
  )
  return { ...data, id: String(data.id) }
}

export async function actualizarChecklistOrdenCocina(
  ordenId: string,
  body: ActualizarChecklistOrdenRequestDto,
): Promise<OrdenCocinaApiDto> {
  const { data } = await apiClient.patch<OrdenCocinaApiDto>(
    `/ordenes-cocina/${ordenId}/checklist`,
    body,
  )
  return { ...data, id: String(data.id) }
}

export async function cancelarOrdenCocinaApi(
  ordenId: string,
  motivo: string,
): Promise<void> {
  await apiClient.post(`/ordenes-cocina/${ordenId}/cancelar`, JSON.stringify(motivo), {
    headers: { "Content-Type": "application/json" },
  })
}
