import type {
  DetalleConciliacion,
  EstadoConciliacion,
  FilaConciliacion,
} from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"

export function construirDetalleDesdeFila(
  fila: FilaConciliacion,
): DetalleConciliacion {
  const badgePorEstado: Record<EstadoConciliacion, string> = {
    coincide: "Sin diferencias",
    "dif-cantidad": "Diferencia de cantidad",
    "dif-tarifa": "Diferencia de tarifa",
    pendiente: "Revisión pendiente",
    "conciliado-manual": "Conciliado manualmente",
  }

  const tarifaNum = Number.parseFloat(fila.tarifa.replace("$", "")) || 0
  const valorBital = fila.cantSist * tarifaNum
  const valorProveedor = fila.cantFact * tarifaNum

  const formatMoney = (n: number) =>
    `$${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  let diferencia = "Sin diferencia registrada"
  if (fila.difCant !== 0 || fila.difEconomica !== "$0.00") {
    const partes: string[] = []
    if (fila.difCant !== 0) {
      partes.push(
        `${fila.difCant > 0 ? "+" : ""}${fila.difCant} unidades`,
      )
    }
    if (fila.difEconomica !== "$0.00") {
      partes.push(fila.difEconomica)
    }
    diferencia = partes.join(" / ")
  }

  return {
    titulo: `${fila.consistencia} - ${fila.tiempo}`,
    codigo: `Cód. ${fila.id.padStart(3, "0")}`,
    badge: badgePorEstado[fila.estado],
    bital: {
      unidades: fila.cantSist,
      valor: formatMoney(valorBital),
    },
    proveedor: {
      unidades: fila.cantFact,
      valor: formatMoney(valorProveedor),
    },
    diferencia,
    totalRegistros: fila.registros?.length ?? fila.cantSist,
    registros:
      fila.registros ??
      (fila.cantSist > 0
        ? [
            {
              fecha: "12 oct, 07:30 a. m.",
              paciente: "García, J.",
              habitacion: "Hab. 304",
              estado: "Confirmada",
            },
            {
              fecha: "12 oct, 07:32 a. m.",
              paciente: "López, M.",
              habitacion: "Hab. 305",
              estado: "Confirmada",
            },
            {
              fecha: "12 oct, 07:35 a. m.",
              paciente: "Ruiz, P.",
              habitacion: "Hab. 308",
              estado: "Confirmada",
            },
          ]
        : []),
  }
}

export function obtenerDetalleConciliacion(
  id: string,
  filas: FilaConciliacion[],
  detalles: Record<string, DetalleConciliacion>,
): DetalleConciliacion | null {
  if (detalles[id]) return detalles[id]

  const fila = filas.find((f) => f.id === id)
  if (!fila) return null

  return construirDetalleDesdeFila(fila)
}
