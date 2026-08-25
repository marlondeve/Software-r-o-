import { describe, expect, it } from "vitest"

import { ordenarOrdenesCocinaEstable } from "@/modules/dietas-cocina/cocina/lib/ordenarOrdenesCocina"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"

function orden(
  parcial: Partial<OrdenCocina> & Pick<OrdenCocina, "id" | "paciente" | "habitacion" | "pabellon">,
): OrdenCocina {
  return {
    edad: 40,
    tipoDieta: "Normal",
    consistencia: "Normal",
    comida: "desayuno",
    aislado: false,
    alergias: [],
    observaciones: "",
    estadoCocina: "lista",
    etiquetaImpresa: false,
    etiquetaGenerada: false,
    checklist: [],
    pacienteId: parcial.id,
    ...parcial,
  }
}

describe("ordenarOrdenesCocinaEstable", () => {
  it("ordena por pabellón, habitación y paciente de forma estable", () => {
    const resultado = ordenarOrdenesCocinaEstable([
      orden({
        id: "3",
        pabellon: "HOSPITALIZACION PISO 1",
        habitacion: "110-1",
        paciente: "ZETA",
      }),
      orden({
        id: "1",
        pabellon: "HOSPITALIZACION PISO 1",
        habitacion: "103-2",
        paciente: "ANDREA",
      }),
      orden({
        id: "2",
        pabellon: "HOSPITALIZACION PISO 1",
        habitacion: "103-3",
        paciente: "MARIANELLA",
      }),
      orden({
        id: "4",
        pabellon: "UCI ADULTO",
        habitacion: "UCA05",
        paciente: "CATALINA",
      }),
    ])

    expect(resultado.map((o) => o.id)).toEqual(["1", "2", "3", "4"])
  })

  it("no cambia el orden relativo ante el mismo criterio (mismo id)", () => {
    const a = orden({
      id: "a",
      pabellon: "P1",
      habitacion: "101",
      paciente: "A",
    })
    const b = orden({
      id: "b",
      pabellon: "P1",
      habitacion: "101",
      paciente: "B",
    })

    expect(ordenarOrdenesCocinaEstable([b, a]).map((o) => o.id)).toEqual([
      "a",
      "b",
    ])
  })
})
