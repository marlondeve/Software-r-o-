import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { FiltrosReportes, ReportesSegmento } from "@/modules/dietas-cocina/types/reports"
import {
  ordenEnTransito,
  resolverEstadoLogisticaOrden,
} from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { aplicarFiltrosReportes } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { mockReportesNutricionista } from "@/modules/dietas-cocina/reportes/datos/mockReportesNutricionista"
import { mockReportesProveedor } from "@/modules/dietas-cocina/reportes/datos/mockReportesProveedor"
import { reporteViewVacio } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import {
  contarDevolucionesEtiquetas,
  esDevolucionConsumida,
} from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import {
  contextoFiltroReporte,
  crearLookupEtiquetaOrden,
  filtrarEtiquetasReporte,
  filtrarOrdenesReporte,
} from "@/modules/dietas-cocina/reportes/lib/filtrarDatosReporte"

function contarPorEstadoLogistico(etiquetas: EtiquetaEnfermera[]) {
  const devoluciones = contarDevolucionesEtiquetas(etiquetas)
  return {
    entregadas: etiquetas.filter((e) => e.estadoLogistica === "entregada").length,
    preEntregadas: etiquetas.filter((e) => e.estadoLogistica === "pre_entregada")
      .length,
    devueltas: devoluciones.devueltas,
    devueltasConsumidas: devoluciones.devueltasConsumidas,
    devueltasTotal: devoluciones.total,
    impresas: etiquetas.filter((e) => e.estadoLogistica === "impresa").length,
    generadas: etiquetas.filter((e) => e.estadoLogistica === "generada").length,
  }
}

function contarTiposDieta(ordenes: OrdenCocina[]) {
  const map = new Map<string, number>()
  for (const orden of ordenes) {
    map.set(orden.tipoDieta, (map.get(orden.tipoDieta) ?? 0) + 1)
  }
  const colores = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]
  return [...map.entries()].slice(0, 5).map(([label, value], i) => ({
    label,
    value,
    color: colores[i % colores.length],
  }))
}

function contarMotivosDevolucion(etiquetas: EtiquetaEnfermera[]) {
  const map = new Map<string, number>()
  for (const etq of etiquetas.filter((e) => e.estadoLogistica === "devuelta")) {
    const motivo = etq.motivoDevolucion ?? "Sin motivo"
    map.set(motivo, (map.get(motivo) ?? 0) + 1)
  }
  const colores = ["#ef4444", "#f97316", "#eab308"]
  return [...map.entries()].slice(0, 3).map(([label, value], i) => ({
    label,
    value: value || 1,
    color: colores[i % colores.length],
  }))
}

function construirSegmentosEstadoOrdenes(
  ordenes: OrdenCocina[],
  getEtiqueta: (ordenId: string) => EtiquetaEnfermera | undefined,
): { segmentos: ReportesSegmento[]; total: number } {
  const activas = ordenes.filter((orden) => orden.estadoCocina !== "cancelada")
  let enCocina = 0
  let listas = 0
  let despachadas = 0
  let recibidas = 0
  let devueltas = 0
  let devueltasConsumidas = 0

  for (const orden of activas) {
    const etiqueta = getEtiqueta(orden.id)
    const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)

    if (logistica === "devuelta") {
      if (esDevolucionConsumida(etiqueta?.motivoDevolucion)) {
        devueltasConsumidas++
      } else {
        devueltas++
      }
      continue
    }
    if (logistica === "entregada" || logistica === "pre_entregada") {
      recibidas++
      continue
    }
    if (orden.estadoCocina === "despachada") {
      despachadas++
      continue
    }
    if (orden.estadoCocina === "lista") {
      listas++
      continue
    }
    enCocina++
  }

  const segmentos = [
    { label: "En cocina", value: enCocina, color: "#94a3b8" },
    { label: "Listas", value: listas, color: "#f59e0b" },
    { label: "Despachadas", value: despachadas, color: "#0ea5e9" },
    { label: "Recibidas", value: recibidas, color: "#8b5cf6" },
    { label: "Devueltas", value: devueltas, color: "#ef4444" },
    {
      label: "Devueltas consumidas",
      value: devueltasConsumidas,
      color: "#f97316",
    },
  ].filter((segmento) => segmento.value > 0)

  return { segmentos, total: activas.length }
}

function construirDistribucionPorTurno(
  ordenes: OrdenCocina[],
): ReportesSegmento[] {
  const colores: Record<TiempoComida, string> = {
    desayuno: "#e879a9",
    "merienda-manana": "#f472b6",
    almuerzo: "#60a5fa",
    "merienda-tarde": "#38bdf8",
    cena: "#a78bfa",
    "merienda-noche": "#c084fc",
  }

  return COMIDAS_TABS.map((comida) => ({
    label: comida.label,
    value: ordenes.filter(
      (orden) =>
        orden.comida === comida.id && orden.estadoCocina !== "cancelada",
    ).length,
    color: colores[comida.id],
  })).filter((item) => item.value > 0)
}

function construirHallazgosProveedor(
  ordenes: OrdenCocina[],
  getEtiqueta: (ordenId: string) => EtiquetaEnfermera | undefined,
  filtros: FiltrosReportes,
) {
  const contexto = contextoFiltroReporte(filtros)
  const hallazgos: Array<{
    variant: "destructive" | "info" | "warning"
    titulo: string
    descripcion: string
  }> = []

  const fueraDeVentana = ordenes.filter((orden) =>
    ordenEnTransito(orden, getEtiqueta(orden.id)),
  ).length
  if (fueraDeVentana > 0) {
    hallazgos.push({
      variant: "destructive",
      titulo: "Despachos fuera de ventana",
      descripcion: `${fueraDeVentana} órdenes superaron el tiempo de tránsito estimado (${contexto}).`,
    })
  }

  const listasSinDespacho = ordenes.filter(
    (orden) => orden.estadoCocina === "lista" && !orden.etiquetaImpresa,
  ).length
  if (listasSinDespacho > 0) {
    hallazgos.push({
      variant: "warning",
      titulo: "Etiquetas pendientes",
      descripcion: `${listasSinDespacho} raciones listas sin escaneo de despacho (${contexto}).`,
    })
  }

  const aisladosEnCocina = ordenes.filter(
    (orden) =>
      orden.aislado &&
      orden.estadoCocina !== "despachada" &&
      orden.estadoCocina !== "cancelada",
  ).length
  if (aisladosEnCocina > 0) {
    hallazgos.push({
      variant: "warning",
      titulo: "Recolección de vajilla",
      descripcion: `${aisladosEnCocina} bandeja(s) con aislamiento activo pendientes de cierre (${contexto}).`,
    })
  }

  if (hallazgos.length === 0) {
    hallazgos.push({
      variant: "info",
      titulo: "Sin alertas operativas",
      descripcion: `No hay incidencias para ${contexto}.`,
    })
  }

  return hallazgos
}

function construirSegmentosEstadoEtiquetas(stats: ReturnType<typeof contarPorEstadoLogistico>) {
  return [
    { label: "Entregadas", value: stats.entregadas, color: "#22c55e" },
    {
      label: "En tránsito",
      value: stats.preEntregadas + stats.impresas + stats.generadas,
      color: "#0ea5e9",
    },
    { label: "Devueltas", value: stats.devueltas, color: "#ef4444" },
    {
      label: "Devueltas consumidas",
      value: stats.devueltasConsumidas,
      color: "#f97316",
    },
  ].filter((segmento) => segmento.value > 0)
}

function construirHallazgosNutricionista(
  stats: ReturnType<typeof contarPorEstadoLogistico>,
  totalEtiquetas: number,
) {
  if (totalEtiquetas === 0) {
    return [
      {
        variant: "info" as const,
        titulo: "Sin actividad en sesión",
        descripcion: "No hay etiquetas registradas en la sesión actual.",
      },
    ]
  }

  const hallazgos: Array<{
    variant: "destructive" | "info" | "warning"
    titulo: string
    descripcion: string
  }> = []

  if (stats.devueltasTotal > 0) {
    hallazgos.push({
      variant: "warning",
      titulo: "Devoluciones en sesión",
      descripcion: `${stats.devueltas} devuelta(s), ${stats.devueltasConsumidas} devuelta(s) consumida(s) de ${totalEtiquetas} en la sesión actual.`,
    })
  }

  hallazgos.push({
    variant: "info",
    titulo: "Ciclo operativo en vivo",
    descripcion: `${stats.entregadas} entregadas, ${stats.devueltas} devueltas, ${stats.devueltasConsumidas} devueltas consumidas de ${totalEtiquetas} etiquetas en sesión.`,
  })

  return hallazgos
}

/** Mezcla datos del ciclo operativo con el mock base de reportes. */
export function construirReportesNutricionistaDesdeCiclo(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  filtros: FiltrosReportes,
  opciones?: { soloDatosReales?: boolean },
) {
  const soloReal = opciones?.soloDatosReales ?? false
  const base = soloReal
    ? reporteViewVacio()
    : aplicarFiltrosReportes(mockReportesNutricionista, filtros)
  const stats = contarPorEstadoLogistico(etiquetas)
  const segmentos = construirSegmentosEstadoEtiquetas(stats)
  const totalNumerico = segmentos.reduce((sum, item) => sum + item.value, 0)

  const tiposDieta = contarTiposDieta(ordenes)
  const motivosDevolucion = contarMotivosDevolucion(etiquetas)

  const kpis = soloReal
    ? base.kpis
    : base.kpis.map((kpi, i) => {
        if (i === 0) return { ...kpi, value: String(ordenes.length) }
        if (i === 2) return { ...kpi, value: String(stats.entregadas) }
        if (i === 3) return { ...kpi, value: String(stats.devueltasTotal) }
        return kpi
      })

  const hallazgos = soloReal
    ? construirHallazgosNutricionista(stats, etiquetas.length)
    : [
        ...base.hallazgos.slice(0, 2),
        {
          titulo: "Ciclo operativo en vivo",
          descripcion: `${stats.entregadas} entregadas, ${stats.devueltas} devueltas, ${stats.devueltasConsumidas} devueltas consumidas de ${etiquetas.length || 0} etiquetas en sesión.`,
          variant: "info" as const,
        },
      ]

  return {
    ...base,
    kpis,
    hitos: soloReal ? [] : base.hitos,
    hallazgos,
    estadoDietas: {
      total: String(totalNumerico),
      totalNumerico,
      segmentos,
    },
    tiposDieta: tiposDieta.length > 0 ? tiposDieta : soloReal ? [] : base.tiposDieta,
    motivosDevolucion:
      motivosDevolucion.length > 0
        ? motivosDevolucion
        : soloReal
          ? []
          : base.motivosDevolucion,
    distribucionServicio: soloReal ? [] : base.distribucionServicio,
    mostrarDistribucionTurno: filtros.horario === "todos",
  }
}

/** Mezcla datos del ciclo operativo con el mock base de reportes proveedor. */
export function construirReportesProveedorDesdeCiclo(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  filtros: FiltrosReportes,
) {
  const base = aplicarFiltrosReportes(mockReportesProveedor, filtros)
  const ordenesFiltradas = filtrarOrdenesReporte(ordenes, filtros)
  const etiquetasFiltradas = filtrarEtiquetasReporte(etiquetas, ordenesFiltradas)
  const getEtiqueta = crearLookupEtiquetaOrden(ordenesFiltradas, etiquetas)
  const stats = contarPorEstadoLogistico(etiquetasFiltradas)
  const preparadas = ordenesFiltradas.filter(
    (orden) => orden.estadoCocina !== "cancelada",
  ).length
  const despachadas = ordenesFiltradas.filter(
    (orden) => orden.estadoCocina === "despachada",
  ).length
  const { segmentos, total } = construirSegmentosEstadoOrdenes(
    ordenesFiltradas,
    getEtiqueta,
  )
  const usarDatosCiclo = ordenesFiltradas.length > 0

  const kpis = base.kpis.map((kpi, i) => {
    if (!usarDatosCiclo) return kpi
    if (i === 0) return { ...kpi, value: String(preparadas) }
    if (i === 1) return { ...kpi, value: String(despachadas) }
    if (i === 2) {
      return {
        ...kpi,
        value: String(stats.preEntregadas + stats.entregadas),
      }
    }
    if (i === 3) return { ...kpi, value: String(stats.devueltasTotal) }
    return kpi
  })

  return {
    ...base,
    kpis,
    estadoDietas: usarDatosCiclo
      ? {
          total: String(total),
          totalNumerico: total,
          segmentos,
        }
      : base.estadoDietas,
    tiposDieta:
      contarTiposDieta(ordenesFiltradas).length > 0
        ? contarTiposDieta(ordenesFiltradas)
        : base.tiposDieta,
    motivosDevolucion:
      contarMotivosDevolucion(etiquetasFiltradas).length > 0
        ? contarMotivosDevolucion(etiquetasFiltradas)
        : base.motivosDevolucion,
    distribucionServicio: usarDatosCiclo
      ? construirDistribucionPorTurno(ordenes)
      : base.distribucionServicio,
    hallazgos: usarDatosCiclo
      ? construirHallazgosProveedor(ordenesFiltradas, getEtiqueta, filtros)
      : base.hallazgos.map((hallazgo) =>
          hallazgo.titulo === "Etiquetas pendientes"
            ? { ...hallazgo, variant: "warning" as const }
            : hallazgo,
        ),
    mostrarDistribucionTurno: filtros.horario === "todos",
  }
}
