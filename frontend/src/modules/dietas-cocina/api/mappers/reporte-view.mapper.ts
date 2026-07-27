import type { ReporteDto } from "@/modules/dietas-cocina/types/api-dtos"
import { normalizarClave } from "@/modules/dietas-cocina/api/utils"

type Segmento = { label: string; value: number; color: string }
type BarItem = { label: string; value: number; color: string }

export function reporteViewVacio() {
  return {
    kpis: [] as Array<{
      label: string
      value: string
      detalle?: string
      detalleVariant?: "positive" | "negative" | "neutral"
    }>,
    hitos: [] as Array<{
      etapa: string
      tiempo: string
      tendencia: string
      tendenciaVariant: "positive" | "negative" | "neutral"
    }>,
    hallazgos: [] as Array<{
      variant: "destructive" | "info" | "warning"
      titulo: string
      descripcion: string
    }>,
    estadoDietas: {
      total: "0",
      totalNumerico: 0,
      segmentos: [] as Segmento[],
    },
    tiposDieta: [] as BarItem[],
    motivosDevolucion: [] as BarItem[],
    distribucionServicio: [] as BarItem[],
    mostrarDistribucionTurno: false,
  }
}

function leerCampo(item: Record<string, unknown>, ...claves: string[]): unknown {
  return normalizarClave(item, ...claves)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function mapHallazgosApi(hallazgos: unknown) {
  if (!Array.isArray(hallazgos)) return []
  return hallazgos.map((raw) => {
    const item = asRecord(raw) ?? {}
    const severidad = String(item.severidad ?? item.Severidad ?? "info").toLowerCase()
    const cantidad = Number(item.cantidad ?? item.Cantidad ?? 0)
    const descripcion = String(
      item.descripcion ?? item.Descripcion ?? item.tipo ?? item.Tipo ?? "",
    )
    return {
      variant:
        severidad === "alta" || severidad === "critica"
          ? ("destructive" as const)
          : severidad === "media"
            ? ("warning" as const)
            : ("info" as const),
      titulo: descripcion || "Hallazgo operativo",
      descripcion:
        cantidad > 0 ? `${cantidad} registro${cantidad === 1 ? "" : "s"} en el período` : "—",
    }
  })
}

export function reporteTieneContenido(
  reporte: ReturnType<typeof mapReporteDto>,
): boolean {
  return (
    reporte.kpis.some((kpi) => Number(kpi.value) > 0) ||
    reporte.estadoDietas.segmentos.length > 0 ||
    reporte.tiposDieta.length > 0 ||
    reporte.motivosDevolucion.length > 0 ||
    reporte.hallazgos.length > 0 ||
    reporte.hitos.length > 0
  )
}

function mapBarItems(items: unknown, fallbackColor = "#006671"): BarItem[] {
  if (!Array.isArray(items)) return []
  return items.map((raw, index) => {
    const item = asRecord(raw) ?? {}
    return {
      label: String(
        leerCampo(item, "label", "nombre", "etiqueta", "Etiqueta", "categoria", "Categoria") ??
          "",
      ),
      value: Number(leerCampo(item, "value", "cantidad", "valor", "Valor") ?? 0),
      color: String(
        item.color ?? SEGMENT_COLORS[index % SEGMENT_COLORS.length] ?? fallbackColor,
      ),
    }
  })
}

const SEGMENT_COLORS = ["#006671", "#00818f", "#bbf244", "#7c6ba8", "#94a3b8"]

function mapGraficosPie(graficos: unknown): Segmento[] {
  if (!Array.isArray(graficos)) return []

  for (const raw of graficos) {
    const grafico = asRecord(raw) ?? {}
    const tipo = String(grafico.tipo ?? grafico.Tipo ?? "").toLowerCase()
    if (tipo !== "pie" && tipo !== "donut" && tipo !== "barra") continue

    const categorias = leerCampo(grafico, "categorias", "Categorias")
    const series = leerCampo(grafico, "series", "Series")
    if (!Array.isArray(categorias) || !Array.isArray(series) || series.length === 0) continue

    const primeraSerie = asRecord(series[0]) ?? {}
    const valores = leerCampo(primeraSerie, "valores", "Valores")
    if (!Array.isArray(valores)) continue

    return categorias.map((categoria, index) => ({
      label: String(categoria),
      value: Number(valores[index] ?? 0),
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length] ?? "#006671",
    }))
  }

  return []
}

function esHitoLogistico(item: Record<string, unknown>): boolean {
  const tiempo = String(leerCampo(item, "tiempo", "Tiempo", "value", "Value") ?? "")
  return /\d+\s*min/i.test(tiempo)
}

export function mapReporteDto(dto: ReporteDto) {
  const vacio = reporteViewVacio()
  const dtoRecord = asRecord(dto) ?? {}
  const graficosRaw = leerCampo(dtoRecord, "graficos", "Graficos")
  const graficosObj = asRecord(graficosRaw)

  const segmentosDesdeObjeto = mapBarItems(
    graficosObj?.estadoDietas ?? graficosObj?.distribucionEstados,
    "#006671",
  )
  const segmentos =
    segmentosDesdeObjeto.length > 0 ? segmentosDesdeObjeto : mapGraficosPie(graficosRaw)
  const totalNumerico = segmentos.reduce((sum, item) => sum + item.value, 0)

  const kpisRaw = leerCampo(dtoRecord, "kpis", "Kpis")
  const hitosRaw = leerCampo(dtoRecord, "hitos", "Hitos")
  const hallazgosRaw = leerCampo(dtoRecord, "hallazgos", "Hallazgos")

  return {
    kpis: Array.isArray(kpisRaw)
      ? kpisRaw.map((raw) => {
          const item = asRecord(raw) ?? {}
          const valor = leerCampo(item, "value", "valor", "Valor")
          return {
            label: String(leerCampo(item, "label", "etiqueta", "Etiqueta") ?? ""),
            value: String(valor ?? ""),
            detalleVariant: "neutral" as const,
          }
        })
      : vacio.kpis,
    hitos: Array.isArray(hitosRaw)
      ? hitosRaw
          .map((raw) => {
            const item = asRecord(raw) ?? {}
            return {
              etapa: String(
                leerCampo(item, "etapa", "Etapa", "evento", "Evento", "label", "Label") ?? "",
              ),
              tiempo: String(
                leerCampo(item, "tiempo", "Tiempo", "detalle", "Detalle", "value", "Value") ??
                  "—",
              ),
              tendencia: String(leerCampo(item, "tendencia", "Tendencia") ?? "—"),
              tendenciaVariant:
                (leerCampo(item, "tendenciaVariant", "TendenciaVariant") as
                  | "positive"
                  | "negative"
                  | "neutral") ?? "neutral",
            }
          })
          .filter((hito) => esHitoLogistico({ tiempo: hito.tiempo }))
      : vacio.hitos,
    hallazgos: mapHallazgosApi(hallazgosRaw),
    estadoDietas: {
      total: totalNumerico > 999 ? `${(totalNumerico / 1000).toFixed(1)}k` : String(totalNumerico),
      totalNumerico,
      segmentos,
    },
    tiposDieta: mapBarItems(graficosObj?.tiposDieta),
    motivosDevolucion: mapBarItems(graficosObj?.motivosDevolucion, "#e879a9"),
    distribucionServicio: mapBarItems(
      graficosObj?.distribucionServicio ?? graficosObj?.distribucionTurno,
    ),
    mostrarDistribucionTurno: mapBarItems(graficosObj?.distribucionTurno).length > 0,
  }
}
