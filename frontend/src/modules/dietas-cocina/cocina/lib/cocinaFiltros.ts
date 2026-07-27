import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import {
  esRecogidaPostEntrega,
  esRechazoAntesEntrega,
} from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import {
  ordenCoincideSeguimiento,
  ordenEnTransito,
  resolverEstadoLogisticaOrden,
  type FiltroSeguimientoCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"
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
  const etiquetaDe = (orden: OrdenCocina) => getEtiquetaByOrdenId?.(orden.id)

  return [
    { id: "total", label: "TOTAL", value: activas.length, variant: "default" as const },
    {
      id: "por-preparar",
      label: "POR PREPARAR",
      value: filtradas.filter((o) => o.estadoCocina === "por_iniciar").length,
      variant: "warning" as const,
    },
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
      id: "recogidas",
      label: "RECOGIDAS",
      value: filtradas.filter((o) => {
        const etiqueta = etiquetaDe(o)
        return resolver(o) === "devuelta" && !!etiqueta && esRecogidaPostEntrega(etiqueta)
      }).length,
      variant: "muted" as const,
    },
    {
      id: "devueltas",
      label: "RECHAZADAS",
      value: filtradas.filter((o) => {
        const etiqueta = etiquetaDe(o)
        return resolver(o) === "devuelta" && !!etiqueta && esRechazoAntesEntrega(etiqueta)
      }).length,
      variant: "destructive" as const,
    },
  ]
}

export function filtrosDesdeKpiCocina(kpiId: string): Partial<FiltrosCocina> {
  switch (kpiId) {
    case "total":
      return { estadoCocina: "Todos", seguimiento: "Todos" }
    case "por-preparar":
      return { estadoCocina: "por_iniciar", seguimiento: "Todos" }
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
    case "recogidas":
      return { estadoCocina: "Todos", seguimiento: "recogida" }
    default:
      return {}
  }
}
