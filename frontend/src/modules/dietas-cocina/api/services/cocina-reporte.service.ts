import { apiClient } from "@/api/client"
import { buildDietasCocinaPath, fechaOperativaHoy, mapearComidaApi } from "@/modules/dietas-cocina/api/utils"
import type { FiltrosCocina } from "@/modules/dietas-cocina/cocina/lib/cocinaFiltros"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

const MIME_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export interface DescargarReporteCocinaOpciones {
  comida: TiempoComida
  fecha?: string
  filtros?: FiltrosCocina
}

function paramsReporteCocina({
  comida,
  fecha = fechaOperativaHoy(),
  filtros,
}: DescargarReporteCocinaOpciones): Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {
    fecha,
    comida: mapearComidaApi(comida),
    formato: "xlsx",
  }

  if (!filtros) return params

  if (filtros.pabellon !== "Todos") params.pabellon = filtros.pabellon
  if (filtros.habitacion !== "Todas") params.habitacion = filtros.habitacion
  if (filtros.tipoDieta !== "Todos") params.tipoDieta = filtros.tipoDieta
  if (filtros.consistencia !== "Todas") params.consistencia = filtros.consistencia
  if (filtros.estadoCocina !== "Todos") params.estadoCocina = filtros.estadoCocina
  if (filtros.seguimiento !== "Todos") params.seguimiento = filtros.seguimiento
  if (filtros.soloAislados) params.soloAislados = true

  const busqueda = filtros.busqueda.trim()
  if (busqueda) params.busqueda = busqueda

  return params
}

export async function descargarReporteCocinaExcel(
  opciones: DescargarReporteCocinaOpciones,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(buildDietasCocinaPath("/cocina/reporte"), {
    params: paramsReporteCocina(opciones),
    responseType: "blob",
    headers: { Accept: `${MIME_XLSX}, application/json` },
  })
  return data
}

export function nombreArchivoReporteCocina(comida: TiempoComida, fecha = fechaOperativaHoy()): string {
  return `reporte-cocina-${fecha}-${comida}.xlsx`
}
