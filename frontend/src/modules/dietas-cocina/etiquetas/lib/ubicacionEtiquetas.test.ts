import { describe, expect, it } from "vitest"

import {
  etiquetaCoincideUbicacion,
  listarUbicacionesDesdeEtiquetas,
} from "@/modules/dietas-cocina/etiquetas/lib/ubicacionEtiquetas"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

function etiqueta(
  id: string,
  overrides: Partial<EtiquetaEnfermera> = {},
): EtiquetaEnfermera {
  return {
    id,
    codigo: `ETQ-${id}`,
    pacienteId: `PAC-${id}`,
    paciente: `Paciente ${id}`,
    documento: "123",
    edad: 40,
    aislamiento: false,
    pabellon: "URGENCIAS HOSPITALIZADO",
    habitacion: "UCA02",
    tipoDieta: "Normal",
    consistencia: "Normal",
    observaciones: "",
    comida: "almuerzo",
    fechaHora: "2026-08-26T12:00:00",
    estado: "impresa",
    qrPayload: id,
    estadoLogistica: "impresa",
    ...overrides,
  }
}

describe("ubicacionEtiquetas", () => {
  it("lista pabellones únicos ordenados", () => {
    const opciones = listarUbicacionesDesdeEtiquetas([
      etiqueta("1", { pabellon: "UCI ADULTO" }),
      etiqueta("2", { pabellon: "URGENCIAS HOSPITALIZADO" }),
      etiqueta("3", { pabellon: "UCI ADULTO" }),
      etiqueta("4", { pabellon: "" }),
    ])

    expect(opciones.map((o) => o.value)).toEqual([
      "UCI ADULTO",
      "URGENCIAS HOSPITALIZADO",
    ])
  })

  it("filtra por ubicación", () => {
    const item = etiqueta("1", { pabellon: "UCI ADULTO" })
    expect(etiquetaCoincideUbicacion(item, "todas")).toBe(true)
    expect(etiquetaCoincideUbicacion(item, "UCI ADULTO")).toBe(true)
    expect(etiquetaCoincideUbicacion(item, "URGENCIAS HOSPITALIZADO")).toBe(
      false,
    )
  })
})
