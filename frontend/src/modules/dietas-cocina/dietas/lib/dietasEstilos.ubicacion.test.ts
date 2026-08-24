import { describe, expect, it } from "vitest"

import {
  filaCoincideUbicacion,
  listarUbicacionesDesdeFilas,
} from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function fila(parcial: Partial<FilaDieta> & Pick<FilaDieta, "pabellon" | "habitacion">): FilaDieta {
  return {
    id: "1",
    pacienteId: "p1",
    paciente: "Paciente",
    edad: 30,
    servicio: "Hospitalización",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "no-solicitada",
    comida: "almuerzo",
    ...parcial,
  }
}

describe("ubicaciones dietas", () => {
  it("agrupa por pabellón sin habitaciones", () => {
    const opciones = listarUbicacionesDesdeFilas([
      fila({ pabellon: "HOSPITALIZACION PISO 1", habitacion: "102-1" }),
      fila({ pabellon: "HOSPITALIZACION PISO 1", habitacion: "101-2" }),
      fila({ pabellon: "UCI ADULTO", habitacion: "UCA05" }),
    ])

    expect(opciones).toHaveLength(2)
    expect(opciones.map((o) => o.label)).toEqual([
      "HOSPITALIZACION PISO 1",
      "UCI ADULTO",
    ])
  })

  it("filtra todas las camas del mismo pabellón", () => {
    const item = fila({ pabellon: "HOSPITALIZACION PISO 1", habitacion: "201-A" })
    expect(filaCoincideUbicacion(item, "HOSPITALIZACION PISO 1")).toBe(true)
    expect(filaCoincideUbicacion(item, "todas")).toBe(true)
    expect(filaCoincideUbicacion(item, "UCI ADULTO")).toBe(false)
  })
})
