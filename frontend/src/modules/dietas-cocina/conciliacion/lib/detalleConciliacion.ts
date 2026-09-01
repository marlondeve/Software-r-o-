import type {
  DetalleConciliacion,
  FilaConciliacion,
} from "@/modules/dietas-cocina/types/reconciliation"
import type { EstadoConciliacion } from "@/modules/dietas-cocina/types/enums"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"

const BADGE_POR_ESTADO: Record<EstadoConciliacion, string> = {
  coincide: "Sin diferencias",
  "dif-cantidad": "Diferencia de cantidad",
  "dif-tipo": "Tipo distinto al cobrado",
  "dif-tarifa": "Diferencia de tarifa",
  pendiente: "Planilla pendiente",
  "con-alerta": "Con alerta",
  "conciliado-manual": "Conciliado",
}

export function construirDetalleDesdeFila(
  fila: FilaConciliacion,
): DetalleConciliacion {
  const cocinaTxt =
    fila.cantidadCocina === null
      ? "—"
      : formatearMonedaCOP(fila.valorCocina ?? 0)

  let diferencia = "Sin planilla de cocina"
  if (fila.cantidadCocina !== null) {
    const partes: string[] = []
    if (fila.diferenciaCantidad !== 0) {
      partes.push(
        `${fila.diferenciaCantidad > 0 ? "+" : ""}${fila.diferenciaCantidad} unidades`,
      )
    }
    if (fila.diferenciaEconomica != null && fila.diferenciaEconomica !== 0) {
      partes.push(formatearMonedaCOP(fila.diferenciaEconomica, true))
    }
    diferencia = partes.length > 0 ? partes.join(" / ") : "Sin diferencia"
  }

  return {
    titulo: `${fila.etiquetaPlanilla} · ${fila.comida}`,
    codigo: `Cód. ${fila.id.slice(0, 8) || "—"}`,
    badge: BADGE_POR_ESTADO[fila.estado] ?? fila.estado,
    sistema: {
      unidades: fila.cantidadSistema,
      valor: formatearMonedaCOP(fila.valorSistema),
    },
    cocina: {
      unidades: fila.cantidadCocina,
      valor: cocinaTxt,
    },
    diferencia,
    totalRegistros: 0,
    registros: [],
    alertas: [],
    recomendaciones: [],
  }
}

export function obtenerDetalleConciliacion(
  id: string,
  filas: FilaConciliacion[],
  detalles: Record<string, DetalleConciliacion> = {},
): DetalleConciliacion | null {
  if (detalles[id]) return detalles[id]
  const fila = filas.find((f) => f.id === id)
  if (!fila) return null
  return construirDetalleDesdeFila(fila)
}
