import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"

export {
  badgeClassPorEstado,
  conciliacionColores,
} from "@/modules/dietas-cocina/lib/estadosEstilos"

import { conciliacionColores } from "@/modules/dietas-cocina/lib/estadosEstilos"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"

export function filaRequiereAtencion(fila: FilaConciliacion): boolean {
  return (
    fila.estado === "dif-cantidad" ||
    fila.estado === "dif-tipo" ||
    fila.estado === "dif-tarifa" ||
    fila.estado === "con-alerta" ||
    fila.estado === "pendiente"
  )
}

export function claseDiferenciaCantidad(fila: FilaConciliacion): string {
  return fila.diferenciaCantidad !== 0 ? conciliacionColores.alerta : ""
}

export function claseDiferenciaEconomica(fila: FilaConciliacion): string {
  if (fila.diferenciaEconomica == null) return conciliacionColores.neutro
  if (fila.diferenciaEconomica < 0) return conciliacionColores.error
  if (fila.diferenciaEconomica > 0) return conciliacionColores.alerta
  return ""
}

export function textoDiferenciaEconomica(fila: FilaConciliacion): string {
  if (fila.diferenciaEconomica == null) return "—"
  if (fila.diferenciaEconomica === 0) return formatearMonedaCOP(0)
  return formatearMonedaCOP(fila.diferenciaEconomica, true)
}

export function textoCantidadCocina(fila: FilaConciliacion): string {
  return fila.cantidadCocina === null ? "—" : String(fila.cantidadCocina)
}

/** Líneas conciliadas o en revisión no se sobrescriben al capturar cocina. */
export function filaCocinaEditable(fila: FilaConciliacion): boolean {
  return fila.estado !== "conciliado-manual"
}
