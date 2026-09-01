import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import { buildDietasCocinaPath, extraerCuerpoApi, mapearComidaApi } from "@/modules/dietas-cocina/api/utils"
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
  return extraerCuerpoApi(data)
}

export async function obtenerReporteProveedor(filtros: FiltrosReportes): Promise<ReporteDto> {
  const { data } = await apiClient.get<ApiResponse<ReporteDto>>(
    buildDietasCocinaPath("/reportes/proveedor"),
    { params: paramsReporte(filtros) },
  )
  return extraerCuerpoApi(data)
}

const MIME_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export type TipoReporteDashboard = "clinico" | "produccion"

function rutaReporteDashboard(tipo: TipoReporteDashboard): string {
  return tipo === "clinico"
    ? buildDietasCocinaPath("/reportes/nutricionista")
    : buildDietasCocinaPath("/reportes/proveedor")
}

export async function descargarReporteDashboardExcel(
  tipo: TipoReporteDashboard,
  filtros: FiltrosReportes,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(rutaReporteDashboard(tipo), {
    params: { ...paramsReporte(filtros), formato: "xlsx" },
    responseType: "blob",
    headers: { Accept: `${MIME_XLSX}, application/json` },
  })
  return data
}

export function nombreArchivoReporteDashboard(
  tipo: TipoReporteDashboard,
  filtros: FiltrosReportes,
): string {
  const prefijo = tipo === "clinico" ? "reporte-clinico" : "reporte-produccion"
  const rango =
    filtros.desde === filtros.hasta
      ? filtros.desde
      : `${filtros.desde}_${filtros.hasta}`
  return `${prefijo}-${rango}.xlsx`
}
