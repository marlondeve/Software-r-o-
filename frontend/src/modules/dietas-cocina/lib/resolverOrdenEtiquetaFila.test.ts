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
    consistencia: "Normal",
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
    consistencia: "Normal",
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

  it("conserva la orden cuando la fila falta en el snapshot de censo", () => {
    const filas = [
      filaBase("otra-fila", {
        pacienteId: "PAC-2",
        ordenCocinaId: "orden-api-otra",
      }),
    ]
    const ordenes = [
      ordenBase({ id: "fila-ausente", ordenCocinaApiId: "orden-api-ausente" }),
    ]

    expect(filtrarOrdenesVinculadasAFilas(ordenes, filas)).toHaveLength(1)
  })

  it("conserva la bandeja cancelada como historial del turno", () => {
    const filas = [filaBase("fila-1", { estado: "cancelada" })]
    const ordenes = [ordenBase({ estadoCocina: "cancelada" })]

    expect(filtrarOrdenesVinculadasAFilas(ordenes, filas)).toHaveLength(1)
  })

  it("tras reingreso la bandeja vuelve a cocina aunque el estado local siga cancelado", () => {
    const filas = [filaBase("fila-1", { estado: "confirmada" })]
    const ordenes = [ordenBase({ estadoCocina: "cancelada" })]

    expect(filtrarOrdenesVinculadasAFilas(ordenes, filas)).toHaveLength(1)
  })

  it("elimina la orden cuando la dieta nunca se solicitó", () => {
    const filas = [filaBase("fila-1", { estado: "no-solicitada" })]
    const ordenes = [ordenBase({ estadoCocina: "en_preparacion" })]

    expect(filtrarOrdenesVinculadasAFilas(ordenes, filas)).toHaveLength(0)
  })
})
