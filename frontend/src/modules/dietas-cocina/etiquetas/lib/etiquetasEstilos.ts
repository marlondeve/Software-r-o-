import type { EstadoLogisticaEtiqueta } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { KpiEtiqueta, EtiquetaDieta, EstadoEtiqueta } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { puedeReimprimirEtiqueta } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"

export { puedeReimprimirEtiqueta }

export interface FiltrosEstadoEtiqueta {
  pendientes: boolean
  generadas: boolean
  impresas: boolean
  reimpresas: boolean
}

export const FILTROS_ESTADO_ETIQUETA_INICIAL: FiltrosEstadoEtiqueta = {
  pendientes: true,
  generadas: true,
  impresas: true,
  reimpresas: true,
}

export function etiquetaFueraDeFlujoProveedor(
  estadoLogistica: EstadoLogisticaEtiqueta,
): boolean {
  return (
    estadoLogistica === "pre_entregada" ||
    estadoLogistica === "entregada" ||
    estadoLogistica === "devuelta"
  )
}

export function claseKpiEtiqueta(kpi: KpiEtiqueta): string {
  switch (kpi.variant) {
    case "info":
      return "border-blue-200/80 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20"
    case "success":
      return "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
    case "destructive":
      return "border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
    default:
      return ""
  }
}

export function claseValorKpiEtiqueta(kpi: KpiEtiqueta): string {
  switch (kpi.variant) {
    case "info":
      return "text-blue-600 dark:text-blue-400"
    case "success":
      return "text-emerald-600 dark:text-emerald-400"
    case "destructive":
      return "text-red-600 dark:text-red-400"
    default:
      return "text-foreground"
  }
}

export function etiquetaCoincideEstados(
  etiqueta: EtiquetaDieta,
  filtros: FiltrosEstadoEtiqueta,
): boolean {
  const { pendientes, generadas, impresas, reimpresas } = filtros
  const algunoActivo = pendientes || generadas || impresas || reimpresas
  if (!algunoActivo) return false
  if (pendientes && etiqueta.estado === "pendiente") return true
  if (generadas && etiqueta.estado === "generada") return true
  if (impresas && etiqueta.estado === "impresa") return true
  if (reimpresas && etiqueta.estado === "reimpresa") return true
  return false
}

export function etiquetaCoincideFiltros(
  etiqueta: EtiquetaDieta,
  pabellon: string,
  habitacion: string,
  tipoDieta: string,
): boolean {
  if (pabellon !== "Todos los Pabellones" && etiqueta.pabellon !== pabellon) {
    return false
  }
  if (habitacion !== "Todas las Habitaciones" && etiqueta.habitacion !== habitacion) {
    return false
  }
  if (tipoDieta !== "Todas" && etiqueta.tipoDieta !== tipoDieta) {
    return false
  }
  return true
}

export function estadoEtiquetaImprimible(estado: EstadoEtiqueta): boolean {
  return estado === "generada" || estado === "pendiente"
}

export function filtrosDesdeKpiEtiqueta(
  kpiId: string,
): Partial<FiltrosEstadoEtiqueta> {
  switch (kpiId) {
    case "pendientes":
      return { pendientes: true, generadas: false, impresas: false, reimpresas: false }
    case "generadas":
      return { pendientes: false, generadas: true, impresas: false, reimpresas: false }
    case "impresas":
      return { pendientes: false, generadas: false, impresas: true, reimpresas: false }
    case "reimpresas":
      return { pendientes: false, generadas: false, impresas: false, reimpresas: true }
    default:
      return FILTROS_ESTADO_ETIQUETA_INICIAL
  }
}

export function calcularKpisEtiquetasProveedor(
  etiquetas: EtiquetaEnfermera[],
  comida: EtiquetaDieta["comida"],
): KpiEtiqueta[] {
  const enCocina = etiquetas.filter(
    (e) =>
      e.comida === comida && !etiquetaFueraDeFlujoProveedor(e.estadoLogistica),
  )
  const recibidas = etiquetas.filter(
    (e) =>
      e.comida === comida &&
      (e.estadoLogistica === "pre_entregada" ||
        e.estadoLogistica === "entregada" ||
        e.estadoLogistica === "devuelta"),
  ).length

  return [
    {
      id: "pendientes",
      label: "PENDIENTES POR GENERAR",
      value: enCocina.filter((e) => e.estado === "pendiente").length,
      variant: "default",
    },
    {
      id: "generadas",
      label: "GENERADAS",
      value: enCocina.filter((e) => e.estado === "generada").length,
      variant: "info",
    },
    {
      id: "impresas",
      label: "IMPRESAS",
      value: enCocina.filter((e) => e.estado === "impresa").length,
      variant: "success",
    },
    {
      id: "reimpresas",
      label: "RE-IMPRESAS",
      value: enCocina.filter((e) => e.estado === "reimpresa").length,
      variant: "destructive",
    },
    {
      id: "recibidas-enfermeria",
      label: "RECIBIDAS ENFERMERÍA",
      value: recibidas,
      variant: "info",
    },
  ]
}
