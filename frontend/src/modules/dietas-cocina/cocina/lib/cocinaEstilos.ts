import type { KpiCocina, OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EstadoCocina } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import {
  claseBadgeLogistica,
  etiquetaLogisticaLabel,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
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
  switch (estado) {
    case "por_iniciar":
      return "Por prep."
    case "en_preparacion":
      return "En prep."
    case "lista":
      return "Lista"
    case "despachada":
      return "Despachada"
    case "cancelada":
      return "Cancelada"
  }
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
  switch (estado) {
    case "por_iniciar":
      return "bg-muted text-muted-foreground border-border"
    case "en_preparacion":
      return "bg-orange-500/20 text-orange-900 border-orange-500/40 dark:text-orange-300"
    case "lista":
      return "bg-amber-500/20 text-amber-900 border-amber-500/40 dark:text-amber-300"
    case "despachada":
      return "bg-sky-500/20 text-sky-900 border-sky-500/40 dark:text-sky-300"
    case "cancelada":
      return "bg-muted/80 text-muted-foreground border-border"
  }
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
