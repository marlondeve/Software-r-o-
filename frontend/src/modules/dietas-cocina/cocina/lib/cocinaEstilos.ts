import type { KpiCocina, OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EstadoCocina } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import {
  claseBadgeLogistica,
  etiquetaLogisticaLabel,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import {
  claseBadgeEstadoCocina as claseBadgeEstadoCocinaCentral,
  labelEstadoCocina as labelEstadoCocinaCentral,
} from "@/modules/dietas-cocina/lib/estadosEstilos"
import { labelCierreBandeja } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import { resolverEstadoLogisticaOrden } from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"

export function claseKpiCocina(kpi: KpiCocina): string {
  switch (kpi.variant) {
    case "destructive":
      return "border-l-[3px] border-l-destructive"
    case "success":
      return "border-primary/20 bg-primary/5"
    case "info":
      return "border-sky-500/20 bg-sky-500/5"
    case "warning":
      return "border-amber-500/20 bg-amber-500/5"
    case "muted":
      return "bg-muted/40"
    default:
      return ""
  }
}

export function claseValorKpiCocina(kpi: KpiCocina): string {
  switch (kpi.variant) {
    case "destructive":
      return "text-destructive"
    case "success":
      return "text-primary"
    case "info":
      return "text-sky-700 dark:text-sky-400"
    default:
      return "text-foreground"
  }
}

export function labelEstadoCocina(estado: EstadoCocina): string {
  return labelEstadoCocinaCentral(estado)
}

export function labelEstadoVisibleCocina(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): string {
  const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)
  if (logistica === "pre_entregada") return "Pre-entregada"
  if (logistica === "entregada") return "Entregada"
  if (logistica === "devuelta" && etiqueta) return labelCierreBandeja(etiqueta)
  if (logistica === "devuelta") return "Recogida"
  return labelEstadoCocina(orden.estadoCocina)
}

export function claseBadgeEstadoVisibleCocina(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): string {
  const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)
  if (logistica === "pre_entregada") {
    return claseBadgeLogistica("pre_entregada")
  }
  if (logistica === "entregada") {
    return claseBadgeLogistica("entregada")
  }
  if (logistica === "devuelta") {
    return claseBadgeLogistica("devuelta")
  }
  return claseBadgeEstadoCocina(orden.estadoCocina)
}

export function descripcionEstadoLogisticaCocina(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): string | undefined {
  const logistica = resolverEstadoLogisticaOrden(orden, etiqueta)
  if (!logistica || logistica === "generada" || logistica === "impresa") {
    return undefined
  }
  return etiquetaLogisticaLabel(logistica, etiqueta)
}

export function claseBadgeEstadoCocina(estado: EstadoCocina): string {
  return claseBadgeEstadoCocinaCentral(estado)
}

export function claseTipoDieta(tipo: string): string {
  const t = tipo.toUpperCase()
  if (t.includes("HIPOSÓDICA") || t.includes("HIPOSODICA")) {
    return "text-sky-700 dark:text-sky-400"
  }
  if (t.includes("PROTEICA")) return "text-red-600 dark:text-red-400"
  if (t.includes("DIABÉTICA") || t.includes("DIABETICA")) {
    return "text-teal-700 dark:text-teal-400"
  }
  return "text-foreground"
}

export function enmascararId(id: string): string {
  const digits = id.replace(/\D/g, "")
  if (digits.length >= 3) return `***${digits.slice(-3)}`
  return id
}
