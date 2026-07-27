import type { EstadoLogisticaEtiqueta } from "@/modules/dietas-cocina/types/enums"
import { formatearHoraDesdeFecha } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

export function etiquetaLogisticaLabel(estado: EstadoLogisticaEtiqueta): string {
  switch (estado) {
    case "generada":
      return "Generada — pendiente impresión"
    case "impresa":
      return "Impresa — pendiente recepción"
    case "pre_entregada":
      return "Recibida por enfermería"
    case "entregada":
      return "Entregada al paciente"
    case "devuelta":
      return "Devuelta a cocina"
  }
}

export function claseBadgeLogistica(estado: EstadoLogisticaEtiqueta): string {
  switch (estado) {
    case "generada":
      return "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400"
    case "impresa":
      return "bg-muted text-muted-foreground border-border"
    case "pre_entregada":
      return "bg-violet-500/20 text-violet-900 border-violet-500/40 dark:text-violet-300"
    case "entregada":
      return "bg-emerald-500/25 text-emerald-900 border-emerald-600/40 dark:text-emerald-300"
    case "devuelta":
      return "bg-destructive/10 text-destructive border-destructive/25"
  }
}

export function claseChipMotivoDevolucion(activo: boolean): string {
  return activo
    ? "border-destructive bg-destructive/5 text-destructive"
    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
}

export function formatearHoraActual(): string {
  return formatearHoraDesdeFecha()
}
