import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  ordenCoincideSeguimiento,
  ordenEnTransito,
  resolverEstadoLogisticaOrden,
  type FiltroSeguimientoCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

export interface FiltrosCocina {
  pabellon: string
  habitacion: string
  tipoDieta: string
  consistencia: string
  estadoCocina: string
  seguimiento: FiltroSeguimientoCocina
  soloAislados: boolean
  busqueda: string
}

export type ResolverEtiquetaOrden = (ordenId: string) => EtiquetaEnfermera | undefined

export function ordenCoincideFiltros(
  orden: OrdenCocina,
  filtros: FiltrosCocina,
  getEtiquetaByOrdenId?: ResolverEtiquetaOrden,
): boolean {
  const etiqueta = getEtiquetaByOrdenId?.(orden.id)
  if (filtros.pabellon !== "Todos" && orden.pabellon !== filtros.pabellon) {
    return false
  }
  if (
    filtros.habitacion !== "Todas" &&
    orden.habitacion !== filtros.habitacion
  ) {
    return false
  }
  if (filtros.tipoDieta !== "Todos" && orden.tipoDieta !== filtros.tipoDieta) {
    return false
  }
  if (
    filtros.consistencia !== "Todas" &&
    orden.consistencia !== filtros.consistencia
  ) {
    return false
  }
  if (
    filtros.estadoCocina !== "Todos" &&
    orden.estadoCocina !== filtros.estadoCocina
  ) {
    return false
  }
  if (filtros.soloAislados && !orden.aislado) return false
  if (!ordenCoincideSeguimiento(orden, filtros.seguimiento, etiqueta)) {
    return false
  }

  const q = filtros.busqueda.trim().toLowerCase()
  if (q) {
    const hay =
      orden.paciente.toLowerCase().includes(q) ||
      orden.pacienteId.toLowerCase().includes(q) ||
      orden.habitacion.toLowerCase().includes(q)
    if (!hay) return false
  }

  return true
}

export function calcularKpisCocina(
  ordenes: OrdenCocina[],
  comida: TiempoComida,
  getEtiquetaByOrdenId?: ResolverEtiquetaOrden,
) {
  const filtradas = ordenes.filter((o) => o.comida === comida)
  const activas = filtradas.filter((o) => o.estadoCocina !== "cancelada")
  const resolver = (orden: OrdenCocina) =>
    resolverEstadoLogisticaOrden(orden, getEtiquetaByOrdenId?.(orden.id))

  return [
    { id: "total", label: "TOTAL", value: activas.length, variant: "default" as const },
    {
      id: "en-preparacion",
      label: "EN PREPARACIÓN",
      value: filtradas.filter((o) => o.estadoCocina === "en_preparacion").length,
      variant: "default" as const,
    },
    {
      id: "listas",
      label: "LISTAS",
      value: filtradas.filter((o) => o.estadoCocina === "lista").length,
      variant: "success" as const,
    },
    {
      id: "despachadas",
      label: "EN TRÁNSITO",
      value: filtradas.filter((o) =>
        ordenEnTransito(o, getEtiquetaByOrdenId?.(o.id)),
      ).length,
      variant: "info" as const,
    },
    {
      id: "recibidas-enfermeria",
      label: "PRE-ENTREGADAS",
      value: filtradas.filter((o) => resolver(o) === "pre_entregada").length,
      variant: "info" as const,
    },
    {
      id: "entregadas",
      label: "ENTREGADAS",
      value: filtradas.filter((o) => resolver(o) === "entregada").length,
      variant: "success" as const,
    },
    {
      id: "canceladas",
      label: "CANCELADAS",
      value: filtradas.filter((o) => o.estadoCocina === "cancelada").length,
      variant: "muted" as const,
    },
    {
      id: "devueltas",
      label: "DEVUELTAS",
      value: filtradas.filter((o) => resolver(o) === "devuelta").length,
      variant: "destructive" as const,
    },
  ]
}

export function filtrosDesdeKpiCocina(kpiId: string): Partial<FiltrosCocina> {
  switch (kpiId) {
    case "total":
      return { estadoCocina: "Todos", seguimiento: "Todos" }
    case "en-preparacion":
      return { estadoCocina: "en_preparacion", seguimiento: "Todos" }
    case "listas":
      return { estadoCocina: "lista", seguimiento: "Todos" }
    case "despachadas":
      return { estadoCocina: "despachada", seguimiento: "en_transito" }
    case "recibidas-enfermeria":
      return { estadoCocina: "despachada", seguimiento: "pre_entregada" }
    case "entregadas":
      return { estadoCocina: "Todos", seguimiento: "entregada" }
    case "canceladas":
      return { estadoCocina: "cancelada", seguimiento: "Todos" }
    case "devueltas":
      return { estadoCocina: "Todos", seguimiento: "devuelta" }
    default:
      return {}
  }
}
