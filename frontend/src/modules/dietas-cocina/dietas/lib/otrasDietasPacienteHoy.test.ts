import { describe, expect, it } from "vitest"

import { listarOtrasDietasPacienteHoy } from "@/modules/dietas-cocina/dietas/lib/otrasDietasPacienteHoy"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function fila(
  parcial: Partial<FilaDieta> & Pick<FilaDieta, "id" | "comida" | "estado">,
): FilaDieta {
  return {
    pacienteId: "CC-1",
    paciente: "Paciente",
    edad: 40,
    servicio: "Medicina",
    pabellon: "P1",
    habitacion: "101",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    ...parcial,
  }
}

describe("listarOtrasDietasPacienteHoy", () => {
  it("ordena por turno fijo y elimina duplicados de la misma comida", () => {
    const resultado = listarOtrasDietasPacienteHoy(
      [
        fila({ id: "cena-dup", comida: "cena", estado: "no-solicitada" }),
        fila({ id: "desayuno-ok", comida: "desayuno", estado: "despachada" }),
        fila({ id: "actual", comida: "almuerzo", estado: "despachada" }),
        fila({ id: "desayuno-vieja", comida: "desayuno", estado: "no-solicitada" }),
        fila({ id: "merienda", comida: "merienda-manana", estado: "no-solicitada" }),
        fila({ id: "cena-ok", comida: "cena", estado: "despachada" }),
      ],
      "actual",
    )

    expect(resultado.map((item) => `${item.comida}:${item.id}`)).toEqual([
      "desayuno:desayuno-ok",
      "merienda-manana:merienda",
      "cena:cena-ok",
    ])
  })
})
