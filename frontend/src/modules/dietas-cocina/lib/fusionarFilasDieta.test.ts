import { describe, expect, it } from "vitest"

import { fusionarFilasPorComida } from "@/modules/dietas-cocina/lib/fusionarFilasDieta"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function filaBase(id: string, overrides: Partial<FilaDieta> = {}): FilaDieta {
  return {
    id,
    pacienteId: `PAC-${id}`,
    paciente: "Paciente Test",
    edad: 40,
    servicio: "Medicina",
    pabellon: "P1",
    habitacion: "101",
    consistencia: "Normal",
    tipoDieta: "Normal",
    aislado: false,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "confirmada",
    comida: "desayuno",
    ...overrides,
  }
}

describe("fusionarFilasPorComida", () => {
  it("conserva el estado operativo local al sincronizar censo", () => {
    const locales = [filaBase("1", { estado: "en-preparacion", habitacion: "vieja" })]
    const remotas = [filaBase("1", { estado: "confirmada", habitacion: "103-2" })]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result).toHaveLength(1)
    expect(result[0].estado).toBe("en-preparacion")
    expect(result[0].habitacion).toBe("103-2")
  })

  it("elimina filas locales de pacientes egresados (ya no vienen del HIS)", () => {
    const locales = [
      filaBase("1"),
      filaBase("egreso", { pacienteId: "PAC-EGRESO", estado: "lista-despacho" }),
    ]
    const remotas = [filaBase("1")]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result).toHaveLength(1)
    expect(result[0].pacienteId).toBe("PAC-1")
  })

  it("conserva el censo local si el API responde vacío", () => {
    const locales = [filaBase("1", { estado: "en-preparacion" })]

    expect(fusionarFilasPorComida(locales, [], "desayuno")).toEqual(locales)
  })

  it("no toca filas de otras comidas", () => {
    const locales = [
      filaBase("almuerzo", { comida: "almuerzo", pacienteId: "PAC-A" }),
      filaBase("1"),
    ]
    const remotas = [filaBase("1")]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result.some((f) => f.comida === "almuerzo")).toBe(true)
    expect(result.filter((f) => f.comida === "desayuno")).toHaveLength(1)
  })
})
