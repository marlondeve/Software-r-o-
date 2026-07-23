import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { FiltrosReportes } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { aplicarFiltrosReportes } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"
import { mockReportesNutricionista } from "@/modules/dietas-cocina/reportes/datos/mockReportesNutricionista"
import { mockReportesProveedor } from "@/modules/dietas-cocina/reportes/datos/mockReportesProveedor"

function contarPorEstadoLogistico(etiquetas: EtiquetaEnfermera[]) {
  return {
    entregadas: etiquetas.filter((e) => e.estadoLogistica === "entregada").length,
    preEntregadas: etiquetas.filter((e) => e.estadoLogistica === "pre_entregada")
      .length,
    devueltas: etiquetas.filter((e) => e.estadoLogistica === "devuelta").length,
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

/** Mezcla datos del ciclo operativo con el mock base de reportes. */
export function construirReportesNutricionistaDesdeCiclo(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  filtros: FiltrosReportes,
) {
  const base = aplicarFiltrosReportes(mockReportesNutricionista, filtros)
  const stats = contarPorEstadoLogistico(etiquetas)
  const totalOperativo = etiquetas.length || 1

  const segmentos = [
    {
      label: "Entregadas",
      value: stats.entregadas || base.estadoDietas.segmentos[0]?.value || 0,
      color: "#22c55e",
    },
    {
      label: "En tránsito",
      value:
        stats.preEntregadas + stats.impresas ||
        base.estadoDietas.segmentos[1]?.value ||
        0,
      color: "#0ea5e9",
    },
    {
      label: "Devueltas",
      value: stats.devueltas || base.estadoDietas.segmentos[2]?.value || 0,
      color: "#ef4444",
    },
  ]

  const tiposDieta =
    contarTiposDieta(ordenes).length > 0
      ? contarTiposDieta(ordenes)
      : base.tiposDieta

  const motivosDevolucion =
    contarMotivosDevolucion(etiquetas).length > 0
      ? contarMotivosDevolucion(etiquetas)
      : base.motivosDevolucion

  const kpis = base.kpis.map((kpi, i) => {
    if (i === 0) return { ...kpi, value: String(ordenes.length) }
    if (i === 2) return { ...kpi, value: String(stats.entregadas) }
    if (i === 3) return { ...kpi, value: String(stats.devueltas) }
    return kpi
  })

  const hallazgos = [
    ...base.hallazgos.slice(0, 2),
    {
      titulo: "Ciclo operativo en vivo",
      descripcion: `${stats.entregadas} entregadas, ${stats.devueltas} devueltas de ${totalOperativo} etiquetas en sesión.`,
      variant: "info" as const,
    },
  ]

  return {
    ...base,
    kpis,
    estadoDietas: {
      ...base.estadoDietas,
      segmentos,
      totalNumerico: segmentos.reduce((s, x) => s + x.value, 0),
      total: String(segmentos.reduce((s, x) => s + x.value, 0)),
    },
    tiposDieta,
    motivosDevolucion,
    hallazgos,
  }
}

/** Mezcla datos del ciclo operativo con el mock base de reportes proveedor. */
export function construirReportesProveedorDesdeCiclo(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  filtros: FiltrosReportes,
) {
  const base = aplicarFiltrosReportes(mockReportesProveedor, filtros)
  const stats = contarPorEstadoLogistico(etiquetas)
  const preparadas = ordenes.filter((o) => o.estadoCocina !== "cancelada").length
  const despachadas = ordenes.filter((o) => o.estadoCocina === "despachada").length

  const kpis = base.kpis.map((kpi, i) => {
    if (i === 0) return { ...kpi, value: String(preparadas) }
    if (i === 1) return { ...kpi, value: String(despachadas) }
    if (i === 2) return { ...kpi, value: String(stats.preEntregadas + stats.entregadas) }
    if (i === 3) return { ...kpi, value: String(stats.devueltas) }
    return kpi
  })

  const segmentos = [
    {
      label: "Listas",
      value: ordenes.filter((o) => o.estadoCocina === "lista").length || 1,
      color: "#22c55e",
    },
    {
      label: "Despachadas",
      value: despachadas || 1,
      color: "#0ea5e9",
    },
    {
      label: "Recibidas",
      value: stats.preEntregadas || 1,
      color: "#8b5cf6",
    },
  ]

  return {
    ...base,
    kpis,
    estadoDietas: {
      ...base.estadoDietas,
      segmentos,
      totalNumerico: segmentos.reduce((s, x) => s + x.value, 0),
      total: String(segmentos.reduce((s, x) => s + x.value, 0)),
    },
    tiposDieta:
      contarTiposDieta(ordenes).length > 0
        ? contarTiposDieta(ordenes)
        : base.tiposDieta,
    motivosDevolucion:
      contarMotivosDevolucion(etiquetas).length > 0
        ? contarMotivosDevolucion(etiquetas)
        : base.motivosDevolucion,
  }
}
