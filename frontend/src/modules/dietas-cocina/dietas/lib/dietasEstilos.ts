import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import type { FilaDieta, KpiDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { cn } from "@/lib/utils"

export const ESTADO_FILTRO_LABEL: Record<string, string> = {
  todos: "Todos",
  "no-solicitada": "Sin solicitud",
  guardado: "Guardado",
  confirmada: "Confirmada",
  recibida: "Recibida",
  devuelta: "Devuelta",
  cancelada: "Cancelada",
}

export const ESTADOS_PENDIENTES: EstadoDieta[] = ["no-solicitada", "guardado"]

export function claseKpiDieta(kpi: KpiDieta): string {
  switch (kpi.variant) {
    case "destructive":
      return "border-destructive/30 bg-destructive/5"
    case "warning":
      return "border-amber-500/40 bg-amber-500/5"
    case "success":
      return "border-primary/30 bg-primary/5"
    case "info":
      return "border-sky-500/30 bg-sky-500/5"
    case "muted":
      return "border-border bg-muted/30"
    default:
      return ""
  }
}

export function claseValorKpi(kpi: KpiDieta): string {
  switch (kpi.variant) {
    case "destructive":
      return "text-destructive"
    case "warning":
      return "text-amber-600"
    case "success":
      return "text-primary"
    case "info":
      return "text-sky-600"
    case "muted":
      return "text-muted-foreground"
    default:
      return "text-foreground"
  }
}

export function formatearUbicacion(fila: FilaDieta): string {
  return `${fila.pabellon} · ${fila.habitacion}`
}

export function filaCoincideBusqueda(fila: FilaDieta, termino: string): boolean {
  const q = termino.trim().toLowerCase()
  if (!q) return true
  return (
    fila.paciente.toLowerCase().includes(q) ||
    fila.pacienteId.toLowerCase().includes(q) ||
    fila.habitacion.toLowerCase().includes(q)
  )
}

export function claseFilaSeleccionada(seleccionada: boolean): string | undefined {
  return seleccionada ? "bg-primary/5 hover:bg-primary/8" : undefined
}

export function cnFilaTabla(
  seleccionada: boolean,
  className?: string,
): string | undefined {
  return cn(claseFilaSeleccionada(seleccionada), className)
}
