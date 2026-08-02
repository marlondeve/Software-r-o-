import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"

export {
  badgeClassPorEstado,
  conciliacionColores,
} from "@/modules/dietas-cocina/lib/estadosEstilos"

import { conciliacionColores } from "@/modules/dietas-cocina/lib/estadosEstilos"

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
