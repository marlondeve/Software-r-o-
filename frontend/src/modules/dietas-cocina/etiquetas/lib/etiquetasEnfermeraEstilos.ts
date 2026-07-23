import type { EstadoLogisticaEtiqueta } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"

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
      return "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400"
    case "entregada":
      return "bg-primary/10 text-primary border-primary/25"
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
  const ahora = new Date()
  return ahora.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
