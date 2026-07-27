import type { FilaDieta, KpiDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { cn } from "@/lib/utils"

export const ESTADO_FILTRO_LABEL: Record<string, string> = {
  todos: "Todos",
  "no-solicitada": "Sin solicitud",
  guardado: "Guardado",
  confirmada: "Confirmada",
  recibida: "Recibida",
  devuelta: "Devuelta",
  recogida: "Recogida",
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
  return `${normalizarPabellon(fila.pabellon)} · Hab. ${fila.habitacion}`
}

/** Unifica alias históricos del HIS para evitar duplicidad visual. */
export function normalizarPabellon(pabellon: string): string {
  const alias: Record<string, string> = {
    "Pabellón A": "Pab. Central",
    "Pabellon A": "Pab. Central",
  }
  return alias[pabellon] ?? pabellon
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

export function calcularKpisDietas(
  filas: FilaDieta[],
  comida: TiempoComida,
  resolverEstadoVisible?: (fila: FilaDieta) => EstadoDieta,
): KpiDieta[] {
  const filtradas = filas.filter((fila) => fila.comida === comida)
  const estadoVisible = (fila: FilaDieta) =>
    resolverEstadoVisible?.(fila) ?? fila.estado

  return [
    { id: "total", label: "Total", value: filtradas.length, variant: "default" },
    {
      id: "sin-solicitud",
      label: "Sin solicitud",
      value: filtradas.filter((fila) => estadoVisible(fila) === "no-solicitada")
        .length,
      variant: "destructive",
    },
    {
      id: "guardado",
      label: "Guardado",
      value: filtradas.filter((fila) => estadoVisible(fila) === "guardado").length,
      variant: "warning",
    },
    {
      id: "confirmadas",
      label: "Confirmadas",
      value: filtradas.filter((fila) => estadoVisible(fila) === "confirmada")
        .length,
      variant: "success",
    },
    {
      id: "recibidas",
      label: "Recibidas",
      value: filtradas.filter((fila) => estadoVisible(fila) === "recibida").length,
      variant: "info",
    },
    {
      id: "recogidas",
      label: "Recogidas",
      value: filtradas.filter((fila) => estadoVisible(fila) === "recogida").length,
      variant: "muted",
    },
    {
      id: "devueltas",
      label: "Rechazadas",
      value: filtradas.filter((fila) => estadoVisible(fila) === "devuelta").length,
      variant: "muted",
    },
    {
      id: "canceladas",
      label: "Canceladas",
      value: filtradas.filter((fila) => fila.estado === "cancelada").length,
      variant: "muted",
    },
  ]
}
