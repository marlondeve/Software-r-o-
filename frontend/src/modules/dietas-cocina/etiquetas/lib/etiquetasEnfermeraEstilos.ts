import type { EstadoLogisticaEtiqueta } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { claseBadgeLogistica as claseBadgeLogisticaCentral } from "@/modules/dietas-cocina/lib/estadosEstilos"
import { labelCierreBandejaDetalle } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import { formatearHoraDesdeFecha } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

export function etiquetaLogisticaLabel(
  estado: EstadoLogisticaEtiqueta,
  etiqueta?: Pick<
    EtiquetaEnfermera,
    "estadoLogistica" | "motivoDevolucion" | "horaEntrega"
  >,
): string {
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
      return etiqueta ? labelCierreBandejaDetalle(etiqueta) : "Recogida por enfermería"
  }
}

export function claseBadgeLogistica(estado: EstadoLogisticaEtiqueta): string {
  return claseBadgeLogisticaCentral(estado)
}

export function claseChipMotivoDevolucion(activo: boolean): string {
  return activo
    ? "border-destructive bg-destructive/5 text-destructive"
    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
}

export function formatearHoraActual(): string {
  return formatearHoraDesdeFecha()
}
