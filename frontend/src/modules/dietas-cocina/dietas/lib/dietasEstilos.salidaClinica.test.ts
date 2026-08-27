import { describe, expect, it } from "vitest"

import {
  calcularKpisDietas,
  ESTADO_FILTRO_LABEL,
} from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import { filaCoincideFiltroEstado } from "@/modules/dietas-cocina/lib/labelEstadoOperativo"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function fila(parcial: Partial<FilaDieta> = {}): FilaDieta {
  return {
    id: "f-1",
    pacienteId: "P-1",
    paciente: "Paciente",
    edad: 40,
    servicio: "Hospitalización",
    pabellon: "Piso 3",
    habitacion: "301",
    consistencia: "Normal",
    tipoDieta: "Corriente",
    aislado: false,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "confirmada",
    comida: "almuerzo",
    ...parcial,
  }
}

const salidaClinica = fila({
  id: "f-salida",
  estado: "cancelada",
  cancelacionPorSalidaClinica: true,
})

const canceladaManual = fila({
  id: "f-cancelada",
  estado: "cancelada",
  observaciones: "Cancelada por indicación médica",
})

describe("KPIs de gestión de dietas", () => {
  it("cuenta salidas clínicas y canceladas por separado", () => {
    const kpis = calcularKpisDietas(
      [fila(), salidaClinica, canceladaManual],
      "almuerzo",
    )
    const valor = (id: string) => kpis.find((kpi) => kpi.id === id)?.value

    expect(valor("salidas-clinicas")).toBe(1)
    expect(valor("canceladas")).toBe(1)
    // En gestión el total es el censo del turno, así que incluye las bajas.
    expect(valor("total")).toBe(3)
  })
})

describe("filtro de estado en gestión de dietas", () => {
  it("cada opción del filtro trae solo su categoría", () => {
    expect(
      filaCoincideFiltroEstado("salida-clinica", "cancelada", salidaClinica),
    ).toBe(true)
    expect(
      filaCoincideFiltroEstado("salida-clinica", "cancelada", canceladaManual),
    ).toBe(false)

    expect(
      filaCoincideFiltroEstado("cancelada", "cancelada", canceladaManual),
    ).toBe(true)
    expect(
      filaCoincideFiltroEstado("cancelada", "cancelada", salidaClinica),
    ).toBe(false)
  })

  it("«todos» no filtra y los demás estados siguen comparando el estado visible", () => {
    expect(filaCoincideFiltroEstado("todos", "cancelada", salidaClinica)).toBe(true)
    expect(filaCoincideFiltroEstado("confirmada", "confirmada", fila())).toBe(true)
    expect(filaCoincideFiltroEstado("confirmada", "guardado", fila())).toBe(false)
  })

  it("filtra asume clínica aparte de las canceladas por egreso", () => {
    const sostenida = fila({
      id: "f-asume",
      estado: "confirmada",
      salidaClinicaSostenida: true,
    })
    expect(
      filaCoincideFiltroEstado("asume-clinica", "confirmada", sostenida),
    ).toBe(true)
    expect(
      filaCoincideFiltroEstado("salida-clinica", "confirmada", sostenida),
    ).toBe(false)
    expect(
      filaCoincideFiltroEstado("asume-clinica", "cancelada", salidaClinica),
    ).toBe(false)
    expect(ESTADO_FILTRO_LABEL["salida-clinica"]).toBe("Salida clínica")
    expect(ESTADO_FILTRO_LABEL.cancelada).toBe("Cancelada")
    expect(ESTADO_FILTRO_LABEL["asume-clinica"]).toBe("Asume clínica")
  })
})
