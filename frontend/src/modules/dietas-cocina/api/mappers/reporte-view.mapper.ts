import type { ReporteDto } from "@/modules/dietas-cocina/types/api-dtos"
import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"
import {
  chartColorHex,
  colorCategoricoPorIndice,
  colorMotivoRechazoPorIndice,
  colorMotivoRecogidaPorIndice,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"
import { normalizarTiempoHitoAHhMm } from "@/modules/dietas-cocina/reportes/lib/formatearDuracionHhMm"

type Segmento = { label: string; value: number; color: string }
type BarItem = { label: string; value: number; color: string }

export function reporteViewVacio() {
  return {
    kpis: [] as Array<{
      clave?: string
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
    contratoPorComida: [] as Array<{ titulo: string; items: BarItem[] }>,
    planillaContrato: [] as Array<{
      titulo: string
      lineas: Array<{
        tipo: string
        suministradas: number
        contrato: number
        valorTotal: number
      }>
    }>,
    motivosDevolucion: [] as BarItem[],
    motivosRecogida: [] as BarItem[],
    distribucionServicio: [] as BarItem[],
    distribucionTurno: [] as BarItem[],
    costoPorDia: [] as BarItem[],
    costoPorServicio: [] as BarItem[],
    costoPorComida: [] as BarItem[],
    mostrarDistribucionTurno: false,
    mostrarCostos: false,
  }
}

function leerCampo(item: Record<string, unknown>, ...claves: string[]): unknown {
  return normalizarClave(item, ...claves)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function mapBarItems(items: unknown, resolverColor = colorCategoricoPorIndice): BarItem[] {
  if (!Array.isArray(items)) return []
  return items.map((raw, index) => {
    const item = asRecord(raw) ?? {}
    return {
      label: String(
        leerCampo(item, "label", "nombre", "etiqueta", "Etiqueta", "categoria", "Categoria") ??
          "",
      ),
      value: Number(leerCampo(item, "value", "cantidad", "valor", "Valor") ?? 0),
      color: String(item.color ?? resolverColor(index)),
    }
  })
}

function formatearValorKpi(item: Record<string, unknown>): string {
  const valor = Number(leerCampo(item, "value", "valor", "Valor") ?? 0)
  const formato = String(leerCampo(item, "formato", "Formato") ?? "numero").toLowerCase()
  if (formato === "porcentaje") return `${valor}%`
  if (formato === "moneda") return `${formatearMonedaCOP(valor)} COP`
  return Number.isInteger(valor) ? String(valor) : valor.toLocaleString("es-CO")
}

function etiquetaFechaCorta(valor: string): string {
  const match = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return valor
  return `${match[3]}/${match[2]}`
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
    reporte.kpis.some((kpi) => Number(kpi.value.replace(/[^\d.-]/g, "")) > 0) ||
    reporte.estadoDietas.segmentos.length > 0 ||
    reporte.tiposDieta.length > 0 ||
    reporte.motivosDevolucion.length > 0 ||
    reporte.motivosRecogida.length > 0 ||
    reporte.hallazgos.length > 0 ||
    reporte.hitos.length > 0
  )
}

function tituloGrafico(grafico: Record<string, unknown>): string {
  return String(grafico.titulo ?? grafico.Titulo ?? "").toLowerCase()
}

function buscarGrafico(graficos: unknown, ...fragmentos: string[]): Record<string, unknown> | null {
  if (!Array.isArray(graficos)) return null
  for (const fragmento of fragmentos) {
    const encontrado = graficos.find((raw) => {
      const grafico = asRecord(raw)
      if (!grafico) return false
      return tituloGrafico(grafico).includes(fragmento.toLowerCase())
    })
    if (encontrado) return asRecord(encontrado)
  }
  return null
}

function mapGraficoABarItems(grafico: Record<string, unknown> | null): BarItem[] {
  if (!grafico) return []

  const categorias = leerCampo(grafico, "categorias", "Categorias")
  const series = leerCampo(grafico, "series", "Series")
  if (!Array.isArray(categorias) || !Array.isArray(series) || series.length === 0) return []

  const primeraSerie = asRecord(series[0]) ?? {}
  const valores = leerCampo(primeraSerie, "valores", "Valores")
  if (!Array.isArray(valores)) return []

  return categorias.map((categoria, index) => ({
    label: String(categoria),
    value: Number(valores[index] ?? 0),
    color: colorCategoricoPorIndice(index),
  }))
}

function mapGraficoAPie(grafico: Record<string, unknown> | null): Segmento[] {
  if (!grafico) return []
  return mapGraficoABarItems(grafico).map((item, index) => ({
    ...item,
    color: colorCategoricoPorIndice(index),
  }))
}

function mapGraficosPiePorTipo(graficos: unknown): Segmento[] {
  if (!Array.isArray(graficos)) return []
  for (const raw of graficos) {
    const grafico = asRecord(raw)
    if (!grafico) continue
    const tipo = String(grafico.tipo ?? grafico.Tipo ?? "").toLowerCase()
    if (tipo !== "pie" && tipo !== "donut") continue
    const titulo = tituloGrafico(grafico)
    if (titulo.includes("estado")) {
      return mapGraficoAPie(grafico)
    }
  }
  return []
}

function mapGraficosBarraPorTitulo(graficos: unknown, ...fragmentos: string[]): BarItem[] {
  const grafico = buscarGrafico(graficos, ...fragmentos)
  if (grafico) return mapGraficoABarItems(grafico)

  if (!Array.isArray(graficos)) return []
  for (const raw of graficos) {
    const graficoItem = asRecord(raw)
    if (!graficoItem) continue
    const tipo = String(graficoItem.tipo ?? graficoItem.Tipo ?? "").toLowerCase()
    if (tipo !== "barra" && tipo !== "bar") continue
    const titulo = tituloGrafico(graficoItem)
    if (fragmentos.some((fragmento) => titulo.includes(fragmento.toLowerCase()))) {
      return mapGraficoABarItems(graficoItem)
    }
  }
  return []
}

export function mapReporteDto(dto: ReporteDto) {
  const vacio = reporteViewVacio()
  const dtoRecord = asRecord(dto) ?? {}
  const graficosRaw = leerCampo(dtoRecord, "graficos", "Graficos")
  const graficosObj = asRecord(graficosRaw)

  const estadoGrafico = buscarGrafico(
    graficosRaw,
    "estado de dietas",
    "estado de órdenes",
    "estado de ordenes",
  )
  const segmentosDesdeObjeto = mapBarItems(
    graficosObj?.estadoDietas ?? graficosObj?.distribucionEstados,
    () => chartColorHex.success,
  )
  const segmentos =
    mapGraficoAPie(estadoGrafico).length > 0
      ? mapGraficoAPie(estadoGrafico)
      : segmentosDesdeObjeto.length > 0
        ? segmentosDesdeObjeto
        : mapGraficosPiePorTipo(graficosRaw)

  const tiposDesdeGraficos = mapBarItems(graficosObj?.tiposDieta)
  const tiposDieta =
    tiposDesdeGraficos.length > 0
      ? tiposDesdeGraficos
      : mapGraficosBarraPorTitulo(
          graficosRaw,
          "tipos de dieta principales",
          "tipos de dieta producidos",
          "tipos de dieta",
        )

  const motivosRechazoDesdeObjeto = mapBarItems(
    graficosObj?.motivosDevolucion,
    colorMotivoRechazoPorIndice,
  )
  const motivosRecogidaDesdeObjeto = mapBarItems(
    graficosObj?.motivosRecogida,
    colorMotivoRecogidaPorIndice,
  )
  const motivosDevolucion =
    motivosRechazoDesdeObjeto.length > 0
      ? motivosRechazoDesdeObjeto
      : mapGraficosBarraPorTitulo(
          graficosRaw,
          "rechazos antes de entrega",
          "motivos de devolución",
          "devolución",
        )
  const motivosRecogida =
    motivosRecogidaDesdeObjeto.length > 0
      ? motivosRecogidaDesdeObjeto
      : mapGraficosBarraPorTitulo(
          graficosRaw,
          "recogidas de bandeja",
          "recogida de bandeja",
          "recogidas",
        )

  const servicioDesdeObjeto = mapBarItems(graficosObj?.distribucionServicio)
  const distribucionServicio =
    servicioDesdeObjeto.length > 0
      ? servicioDesdeObjeto
      : mapGraficosBarraPorTitulo(graficosRaw, "distribución por servicios", "por servicios")

  const turnoDesdeObjeto = mapBarItems(graficosObj?.distribucionTurno)
  const distribucionTurno =
    turnoDesdeObjeto.length > 0
      ? turnoDesdeObjeto
      : mapGraficosBarraPorTitulo(
          graficosRaw,
          "volumen por comida",
          "distribución por turno",
          "por turno",
        )

  const costoPorDia = mapGraficosBarraPorTitulo(
    graficosRaw,
    "costo por día",
    "costo por dia",
  ).map((item) => ({ ...item, label: etiquetaFechaCorta(item.label) }))
  const costoPorServicio = mapGraficosBarraPorTitulo(
    graficosRaw,
    "costo por servicio",
  )
  const costoPorComida = mapGraficosBarraPorTitulo(graficosRaw, "costo por comida")

  const contratoPorComida = Array.isArray(graficosRaw)
    ? graficosRaw
        .map((raw) => asRecord(raw))
        .filter((grafico): grafico is Record<string, unknown> => {
          if (!grafico) return false
          return tituloGrafico(grafico).startsWith("contrato:")
        })
        .map((grafico) => ({
          titulo: String(grafico.titulo ?? grafico.Titulo ?? ""),
          items: mapGraficoABarItems(grafico),
        }))
        .filter((bloque) => bloque.items.length > 0)
    : []

  const planillaContrato = Array.isArray(graficosRaw)
    ? graficosRaw
        .map((raw) => asRecord(raw))
        .filter((grafico): grafico is Record<string, unknown> => {
          if (!grafico) return false
          const tipo = String(leerCampo(grafico, "tipo", "Tipo") ?? "").toLowerCase()
          return tipo === "tabla-contrato" || tituloGrafico(grafico).startsWith("planilla:")
        })
        .map((grafico) => {
          const tituloRaw = String(grafico.titulo ?? grafico.Titulo ?? "")
          const categorias = leerCampo(grafico, "categorias", "Categorias")
          const series = leerCampo(grafico, "series", "Series")
          const valoresDe = (etiqueta: string): number[] => {
            if (!Array.isArray(series)) return []
            const serie = series
              .map((raw) => asRecord(raw))
              .find((item) => {
                const nombre = String(
                  leerCampo(item ?? {}, "etiqueta", "Etiqueta") ?? "",
                ).toLowerCase()
                return nombre === etiqueta.toLowerCase()
              })
            const valores = leerCampo(serie ?? {}, "valores", "Valores")
            return Array.isArray(valores) ? valores.map((v) => Number(v ?? 0)) : []
          }
          const suministradas = valoresDe("Suministradas")
          const contrato = valoresDe("Contrato")
          const valorTotal = valoresDe("ValorTotal")
          const lineas = Array.isArray(categorias)
            ? categorias.map((categoria, index) => ({
                tipo: String(categoria),
                suministradas: suministradas[index] ?? 0,
                contrato: contrato[index] ?? 0,
                valorTotal: valorTotal[index] ?? 0,
              }))
            : []
          return {
            titulo: tituloRaw.replace(/^planilla:\s*/i, ""),
            lineas,
          }
        })
        .filter((bloque) => bloque.lineas.length > 0)
    : []

  const totalNumerico = segmentos.reduce((sum, item) => sum + item.value, 0)

  const kpisRaw = leerCampo(dtoRecord, "kpis", "Kpis")
  const hitosRaw = leerCampo(dtoRecord, "hitos", "Hitos")
  const hallazgosRaw = leerCampo(dtoRecord, "hallazgos", "Hallazgos")

  return {
    kpis: Array.isArray(kpisRaw)
      ? kpisRaw.map((raw) => {
          const item = asRecord(raw) ?? {}
          const comparacion = String(
            leerCampo(item, "comparacion", "Comparacion") ?? "",
          ).trim()
          return {
            clave: String(leerCampo(item, "clave", "Clave") ?? "").trim() || undefined,
            label: String(leerCampo(item, "label", "etiqueta", "Etiqueta") ?? ""),
            value: formatearValorKpi(item),
            detalle: comparacion || undefined,
            detalleVariant: "neutral" as const,
          }
        })
      : vacio.kpis,
    hitos: Array.isArray(hitosRaw)
      ? hitosRaw.map((raw) => {
          const item = asRecord(raw) ?? {}
          return {
            etapa: String(
              leerCampo(item, "etapa", "Etapa", "evento", "Evento", "label", "Label") ?? "",
            ),
            tiempo: normalizarTiempoHitoAHhMm(
              String(
                leerCampo(item, "tiempo", "Tiempo", "detalle", "Detalle", "value", "Value") ??
                  "—",
              ),
            ),
            tendencia: String(leerCampo(item, "tendencia", "Tendencia") ?? "—"),
            tendenciaVariant:
              (leerCampo(item, "tendenciaVariant", "TendenciaVariant") as
                | "positive"
                | "negative"
                | "neutral") ?? "neutral",
          }
        })
      : vacio.hitos,
    hallazgos: mapHallazgosApi(hallazgosRaw),
    estadoDietas: {
      total: totalNumerico > 999 ? `${(totalNumerico / 1000).toFixed(1)}k` : String(totalNumerico),
      totalNumerico,
      segmentos,
    },
    tiposDieta,
    contratoPorComida,
    planillaContrato,
    motivosDevolucion,
    motivosRecogida,
    distribucionServicio,
    distribucionTurno,
    costoPorDia,
    costoPorServicio,
    costoPorComida,
    mostrarDistribucionTurno: distribucionTurno.length > 0,
    mostrarCostos:
      costoPorDia.length > 0 ||
      costoPorServicio.length > 0 ||
      costoPorComida.length > 0,
  }
}
