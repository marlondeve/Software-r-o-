import { describe, expect, it } from "vitest"

import { estuvoComprometidaConCocina } from "@/modules/dietas-cocina/cocina/lib/cocinaVisibilidad"
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

describe("estuvoComprometidaConCocina", () => {
  it("incluye dietas confirmadas y en flujo de cocina", () => {
    expect(estuvoComprometidaConCocina(fila({ estado: "confirmada" }))).toBe(true)
    expect(estuvoComprometidaConCocina(fila({ estado: "lista-despacho" }))).toBe(true)
  })

  it("excluye guardado, solicitada y pendiente", () => {
    expect(estuvoComprometidaConCocina(fila({ estado: "guardado" }))).toBe(false)
    expect(estuvoComprometidaConCocina(fila({ estado: "no-solicitada" }))).toBe(false)
  })

  it("excluye canceladas que nunca llegaron a cocina", () => {
    expect(
      estuvoComprometidaConCocina(
        fila({
          estado: "cancelada",
          observaciones: "Cancelada: [error-solicitud] No requiere dieta",
        }),
      ),
    ).toBe(false)
  })

  it("incluye canceladas que ya tenían orden de cocina", () => {
    expect(
      estuvoComprometidaConCocina(
        fila({
          estado: "cancelada",
          ordenCocinaId: "orden-123",
          cancelacionTardia: true,
        }),
      ),
    ).toBe(true)
  })
})
