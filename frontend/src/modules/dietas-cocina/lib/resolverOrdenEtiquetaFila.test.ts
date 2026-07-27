import { describe, expect, it } from "vitest"

import { filtrarOrdenesVinculadasAFilas } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"

function filaBase(id: string, overrides: Partial<FilaDieta> = {}): FilaDieta {
  return {
    id,
    pacienteId: "PAC-1",
    paciente: "Paciente Test",
    edad: 40,
    servicio: "Medicina",
    pabellon: "P1",
    habitacion: "101",
    consistencia: "Sólida",
    tipoDieta: "Normal",
    aislado: false,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "en-preparacion",
    comida: "merienda-noche",
    ordenCocinaId: "orden-api-1",
    ...overrides,
  }
}

function ordenBase(overrides: Partial<OrdenCocina> = {}): OrdenCocina {
  return {
    id: "fila-1",
    ordenCocinaApiId: "orden-api-1",
    pacienteId: "PAC-1",
    paciente: "Paciente Test",
    edad: 40,
    pabellon: "P1",
    habitacion: "101",
    tipoDieta: "Normal",
    consistencia: "Sólida",
    comida: "merienda-noche",
    aislado: false,
    alergias: [],
    observaciones: "",
    estadoCocina: "en_preparacion",
    etiquetaImpresa: false,
    etiquetaGenerada: false,
    checklist: [],
    ...overrides,
  }
}

describe("filtrarOrdenesVinculadasAFilas", () => {
  it("conserva la orden cuando solo coincide por ordenCocinaApiId", () => {
    const filas = [filaBase("fila-guid-real")]
    const ordenes = [ordenBase({ id: "fila-guid-real", ordenCocinaApiId: "orden-api-1" })]

    expect(filtrarOrdenesVinculadasAFilas(ordenes, filas)).toHaveLength(1)
  })

  it("conserva órdenes del API aún sin fila local", () => {
    const ordenes = [ordenBase({ id: "solo-api" })]

    expect(filtrarOrdenesVinculadasAFilas(ordenes, [])).toHaveLength(1)
  })

  it("elimina órdenes cuando la fila volvió a guardado", () => {
    const filas = [filaBase("fila-1", { estado: "guardado" })]
    const ordenes = [ordenBase()]

    expect(filtrarOrdenesVinculadasAFilas(ordenes, filas)).toHaveLength(0)
  })
})
