import { describe, expect, it } from "vitest"

import {
  ordenarEtiquetasPorUbicacion,
  sincronizarOrdenListaEtiquetas,
  ordenarEtiquetasConListaFija,
} from "@/modules/dietas-cocina/etiquetas/lib/ordenarEtiquetas"
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
    pabellon: "Piso 1",
    habitacion: "101",
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

describe("ordenarEtiquetas", () => {
  it("siembra por pabellón → habitación → paciente", () => {
    const lista = ordenarEtiquetasPorUbicacion([
      etiqueta("b", { pabellon: "UCI", habitacion: "02", paciente: "B" }),
      etiqueta("a", { pabellon: "UCI", habitacion: "01", paciente: "A" }),
      etiqueta("c", { pabellon: "Piso 1", habitacion: "10", paciente: "C" }),
    ])

    expect(lista.map((e) => e.id)).toEqual(["c", "a", "b"])
  })

  it("congela el orden aunque cambien habitación o pabellón", () => {
    const iniciales = [
      etiqueta("1", { pabellon: "Piso 1", habitacion: "101" }),
      etiqueta("2", { pabellon: "Piso 2", habitacion: "201" }),
    ]
    let orden = sincronizarOrdenListaEtiquetas(iniciales, new Map())

    const movidas = [
      etiqueta("2", { pabellon: "Piso 1", habitacion: "050" }),
      etiqueta("1", { pabellon: "Piso 2", habitacion: "999" }),
    ]
    orden = sincronizarOrdenListaEtiquetas(movidas, orden)
    const ordenadas = ordenarEtiquetasConListaFija(movidas, orden)

    expect(ordenadas.map((e) => e.id)).toEqual(["1", "2"])
  })

  it("agrega etiquetas nuevas al final sin reordenar las existentes", () => {
    const iniciales = [
      etiqueta("1", { pabellon: "Z", habitacion: "9" }),
      etiqueta("2", { pabellon: "A", habitacion: "1" }),
    ]
    let orden = sincronizarOrdenListaEtiquetas(iniciales, new Map())

    const conNueva = [
      ...iniciales,
      etiqueta("nueva", { pabellon: "A", habitacion: "0" }),
    ]
    orden = sincronizarOrdenListaEtiquetas(conNueva, orden)
    const ordenadas = ordenarEtiquetasConListaFija(conNueva, orden)

    expect(ordenadas.map((e) => e.id)).toEqual(["2", "1", "nueva"])
  })
})
