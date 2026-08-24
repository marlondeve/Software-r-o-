import { describe, expect, it } from "vitest"

import {
  compararFilasDietasOperativas,
  ordenarFilasDietasOperativas,
} from "@/modules/dietas-cocina/dietas/lib/ordenarFilasDietas"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"

function fila(parcial: Partial<FilaDieta> & Pick<FilaDieta, "id" | "paciente" | "habitacion">): FilaDieta {
  return {
    pacienteId: parcial.id,
    edad: 40,
    servicio: "Medicina Interna",
    pabellon: "Pab. Central",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "guardado",
    comida: "almuerzo",
    ...parcial,
  }
}

describe("ordenarFilasDietasOperativas", () => {
  const resolver = (fila: FilaDieta): EstadoDieta => fila.estado

  it("prioriza sin solicitud y ordena el resto por último cambio", () => {
    const filas = ordenarFilasDietasOperativas(
      [
        fila({
          id: "1",
          paciente: "Zapata",
          habitacion: "302",
          estado: "despachada",
          solicitadoEn: "2026-08-23T08:00:00",
        }),
        fila({
          id: "2",
          paciente: "García",
          habitacion: "301",
          estado: "no-solicitada",
        }),
        fila({
          id: "3",
          paciente: "Ruiz",
          habitacion: "303",
          estado: "despachada",
          solicitadoEn: "2026-08-23T09:00:00",
        }),
      ],
      resolver,
      [],
      [],
    )

    expect(filas.map((item) => item.id)).toEqual(["2", "3", "1"])
  })

  it("desempata por habitación cuando el estado y la fecha coinciden", () => {
    const a = fila({
      id: "a",
      paciente: "B",
      habitacion: "102",
      estado: "no-solicitada",
    })
    const b = fila({
      id: "b",
      paciente: "A",
      habitacion: "101",
      estado: "no-solicitada",
    })

    expect(compararFilasDietasOperativas(a, b, resolver, [], [])).toBeGreaterThan(0)
  })
})
