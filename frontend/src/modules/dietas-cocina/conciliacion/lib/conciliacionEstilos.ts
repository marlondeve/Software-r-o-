import type { EstadoConciliacion, FilaConciliacion } from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"

/** Estilos compartidos de conciliación — una sola paleta en tabla y badges. */
export const conciliacionColores = {
  ok: "text-primary",
  okBadge: "border-primary/20 bg-primary/10 text-primary",
  alerta: "text-amber-700",
  alertaBadge: "border-amber-500/25 bg-amber-500/10 text-amber-700",
  alertaFila: "bg-amber-500/5",
  error: "text-destructive",
  neutro: "text-muted-foreground",
  neutroBadge: "border-border bg-muted text-muted-foreground",
} as const

export function filaRequiereAtencion(fila: FilaConciliacion): boolean {
  return (
    fila.estado === "dif-cantidad" ||
    fila.estado === "dif-tarifa" ||
    fila.estado === "pendiente"
  )
}

export function claseDiferenciaCantidad(fila: FilaConciliacion): string {
  return fila.difCant !== 0 ? conciliacionColores.alerta : ""
}

export function claseDiferenciaEconomica(fila: FilaConciliacion): string {
  if (fila.difEconomica.startsWith("-")) return conciliacionColores.error
  if (fila.difEconomica.startsWith("+")) return conciliacionColores.alerta
  return ""
}

export function badgeClassPorEstado(estado: EstadoConciliacion): string {
  switch (estado) {
    case "coincide":
      return conciliacionColores.okBadge
    case "conciliado-manual":
      return conciliacionColores.neutroBadge
    default:
      return conciliacionColores.alertaBadge
  }
}
