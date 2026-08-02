import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { FiltrosReportes, ReportesSegmento } from "@/modules/dietas-cocina/types/reports"
import {
  ordenEnTransito,
  resolverEstadoLogisticaOrden,
} from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { aplicarFiltrosReportes } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import {
  chartPaletteComidas,
  colorCategoricoPorIndice,
  colorMotivoRechazoPorIndice,
  colorMotivoRecogidaPorIndice,
  segmentoEtiquetaReporteColores,
  segmentoOrdenReporteColores,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"
import { mockReportesNutricionista } from "@/modules/dietas-cocina/reportes/datos/mockReportesNutricionista"
import { mockReportesProveedor } from "@/modules/dietas-cocina/reportes/datos/mockReportesProveedor"
import { reporteViewVacio } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import {
  contarDevolucionesEtiquetas,
  esDevolucionConsumida,
  esRechazoAntesEntrega,
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
    devueltas: devoluciones.rechazadas,
    devueltasConsumidas: devoluciones.recogidasConsumidas,
    recogidas: devoluciones.recogidas,
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
  return [...map.entries()].slice(0, 5).map(([label, value], i) => ({
    label,
    value,
    color: colorCategoricoPorIndice(i),
  }))
}

function contarMotivosPorTipo(
  etiquetas: EtiquetaEnfermera[],
  filtro: (etiqueta: EtiquetaEnfermera) => boolean,
  resolverColor: (indice: number) => string,
) {
  const map = new Map<string, number>()
  for (const etq of etiquetas.filter(filtro)) {
    const motivo = etq.motivoDevolucion ?? "Sin motivo"
    map.set(motivo, (map.get(motivo) ?? 0) + 1)
  }
  return [...map.entries()].slice(0, 3).map(([label, value], i) => ({
    label,
    value: value || 1,
    color: resolverColor(i),
  }))
}

function contarMotivosRechazo(etiquetas: EtiquetaEnfermera[]) {
  return contarMotivosPorTipo(
    etiquetas,
    (etq) => etq.estadoLogistica === "devuelta" && esRechazoAntesEntrega(etq),
    colorMotivoRechazoPorIndice,
  )
}

function contarMotivosRecogida(etiquetas: EtiquetaEnfermera[]) {
  return contarMotivosPorTipo(
    etiquetas,
    (etq) => etq.estadoLogistica === "devuelta" && !esRechazoAntesEntrega(etq),
    colorMotivoRecogidaPorIndice,
  )
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
  let recogidas = 0
  let recogidasConsumidas = 0
  let rechazadas = 0

  for (const orden of activas) {
    const etiqueta = getEtiqueta(orden.id)
    const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)

    if (logistica === "devuelta" && etiqueta) {
      if (esRechazoAntesEntrega(etiqueta)) {
        rechazadas++
      } else if (esDevolucionConsumida(etiqueta.motivoDevolucion)) {
        recogidasConsumidas++
      } else {
        recogidas++
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
    { label: "En cocina", value: enCocina, color: segmentoOrdenReporteColores.enCocina },
    { label: "Listas", value: listas, color: segmentoOrdenReporteColores.listas },
    { label: "Despachadas", value: despachadas, color: segmentoOrdenReporteColores.despachadas },
    { label: "Recibidas", value: recibidas, color: segmentoOrdenReporteColores.recibidas },
    { label: "Recogidas", value: recogidas, color: segmentoOrdenReporteColores.recogidas },
    {
      label: "Recogidas (consumidas)",
      value: recogidasConsumidas,
      color: segmentoOrdenReporteColores.recogidasConsumidas,
    },
    { label: "Rechazadas", value: rechazadas, color: segmentoOrdenReporteColores.rechazadas },
  ].filter((segmento) => segmento.value > 0)

  return { segmentos, total: activas.length }
}

function construirDistribucionPorTurno(
  ordenes: OrdenCocina[],
): ReportesSegmento[] {
  return COMIDAS_TABS.map((comida) => ({
    label: comida.label,
    value: ordenes.filter(
      (orden) =>
        orden.comida === comida.id && orden.estadoCocina !== "cancelada",
    ).length,
    color: chartPaletteComidas[comida.id],
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
    {
      label: "Entregadas",
      value: stats.entregadas,
      color: segmentoEtiquetaReporteColores.entregadas,
    },
    {
      label: "En tránsito",
      value: stats.preEntregadas + stats.impresas + stats.generadas,
      color: segmentoEtiquetaReporteColores.enTransito,
    },
    {
      label: "Recogidas",
      value: stats.recogidas + stats.devueltasConsumidas,
      color: segmentoEtiquetaReporteColores.recogidas,
    },
    {
      label: "Rechazadas",
      value: stats.devueltas,
      color: segmentoEtiquetaReporteColores.rechazadas,
    },
  ].filter((segmento) => segmento.value > 0)
}

function construirHallazgosNutricionista(
  stats: ReturnType<typeof contarPorEstadoLogistico>,
  totalEtiquetas: number,
  filtros: FiltrosReportes,
) {
  const contexto = contextoFiltroReporte(filtros)

  if (totalEtiquetas === 0) {
    return [
      {
        variant: "info" as const,
        titulo: "Sin actividad en el período",
        descripcion: `No hay etiquetas registradas para ${contexto}.`,
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
      titulo: "Cierres de bandeja",
      descripcion: `${stats.recogidas + stats.devueltasConsumidas} recogida(s), ${stats.devueltas} rechazada(s) de ${totalEtiquetas} en ${contexto}.`,
    })
  }

  hallazgos.push({
    variant: "info",
    titulo: "Resumen logístico del período",
    descripcion: `${stats.entregadas} entregadas, ${stats.recogidas + stats.devueltasConsumidas} recogidas, ${stats.devueltas} rechazadas de ${totalEtiquetas} etiquetas (${contexto}).`,
  })

  return hallazgos
}

/** Mezcla datos del ciclo operativo con el mock base de reportes. */
export function construirReportesNutricionistaDesdeCiclo(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  filtros: FiltrosReportes,
  opciones?: { soloDatosReales?: boolean; filas?: FilaDieta[] },
) {
  const soloReal = opciones?.soloDatosReales ?? false
  const filasPorId = opciones?.filas
    ? new Map(opciones.filas.map((fila) => [fila.id, fila]))
    : undefined
  const base = soloReal
    ? reporteViewVacio()
    : aplicarFiltrosReportes(mockReportesNutricionista, filtros)
  const ordenesFiltradas = filtrarOrdenesReporte(ordenes, filtros, filasPorId)
  const etiquetasFiltradas = filtrarEtiquetasReporte(
    etiquetas,
    ordenesFiltradas,
    filtros,
  )
  const stats = contarPorEstadoLogistico(etiquetasFiltradas)
  const segmentos = construirSegmentosEstadoEtiquetas(stats)
  const totalNumerico = segmentos.reduce((sum, item) => sum + item.value, 0)

  const tiposDieta = contarTiposDieta(ordenesFiltradas)
  const motivosDevolucion = contarMotivosRechazo(etiquetasFiltradas)
  const motivosRecogida = contarMotivosRecogida(etiquetasFiltradas)

  const kpis = soloReal
    ? base.kpis
    : base.kpis.map((kpi, i) => {
        if (i === 0) return { ...kpi, value: String(ordenesFiltradas.length) }
        if (i === 2) return { ...kpi, value: String(stats.entregadas) }
        if (i === 3) return { ...kpi, value: String(stats.devueltasTotal) }
        return kpi
      })

  const hallazgos = soloReal
    ? construirHallazgosNutricionista(stats, etiquetasFiltradas.length, filtros)
    : [
        ...base.hallazgos.slice(0, 2),
        {
          titulo: "Resumen logístico del período",
          descripcion: `${stats.entregadas} entregadas, ${stats.recogidas + stats.devueltasConsumidas} recogidas, ${stats.devueltas} rechazadas de ${etiquetasFiltradas.length || 0} etiquetas (${contextoFiltroReporte(filtros)}).`,
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
    motivosRecogida:
      motivosRecogida.length > 0
        ? motivosRecogida
        : soloReal
          ? []
          : base.motivosRecogida,
    distribucionServicio: soloReal ? [] : base.distribucionServicio,
    mostrarDistribucionTurno: filtros.horario === "todos",
  }
}

/** Mezcla datos del ciclo operativo con el mock base de reportes proveedor. */
export function construirReportesProveedorDesdeCiclo(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  filtros: FiltrosReportes,
  filas: FilaDieta[] = [],
) {
  const base = aplicarFiltrosReportes(mockReportesProveedor, filtros)
  const filasPorId = new Map(filas.map((fila) => [fila.id, fila]))
  const ordenesFiltradas = filtrarOrdenesReporte(ordenes, filtros, filasPorId)
  const etiquetasFiltradas = filtrarEtiquetasReporte(
    etiquetas,
    ordenesFiltradas,
    filtros,
  )
  const getEtiqueta = crearLookupEtiquetaOrden(ordenesFiltradas, etiquetasFiltradas)
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
      contarMotivosRechazo(etiquetasFiltradas).length > 0
        ? contarMotivosRechazo(etiquetasFiltradas)
        : base.motivosDevolucion,
    motivosRecogida:
      contarMotivosRecogida(etiquetasFiltradas).length > 0
        ? contarMotivosRecogida(etiquetasFiltradas)
        : base.motivosRecogida,
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
