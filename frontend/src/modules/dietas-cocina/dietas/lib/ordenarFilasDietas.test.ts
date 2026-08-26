import { describe, expect, it } from "vitest"

import {
  compararFilasDietasPorUbicacion,
  ordenarFilasDietasConListaFija,
  ordenarFilasDietasOperativas,
  sincronizarOrdenListaDietas,
} from "@/modules/dietas-cocina/dietas/lib/ordenarFilasDietas"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function fila(
  parcial: Partial<FilaDieta> & Pick<FilaDieta, "id" | "paciente" | "habitacion">,
): FilaDieta {
  return {
    pacienteId: parcial.id,
    edad: 40,
    servicio: "Medicina Interna",
    pabellon: "HOSPITALIZACION PISO 1",
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
  it("ordena por pabellón, habitación y paciente", () => {
    const filas = ordenarFilasDietasOperativas([
      fila({
        id: "3",
        paciente: "Zapata",
        habitacion: "302",
        estado: "despachada",
      }),
      fila({
        id: "2",
        paciente: "García",
        habitacion: "301",
        estado: "no-solicitada",
      }),
      fila({
        id: "1",
        paciente: "Ruiz",
        habitacion: "110",
        estado: "despachada",
      }),
    ])

    expect(filas.map((item) => item.id)).toEqual(["1", "2", "3"])
  })

  it("desempata por habitación cuando el paciente coincide en criterio", () => {
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

    expect(compararFilasDietasPorUbicacion(a, b)).toBeGreaterThan(0)
  })

  it("no reordena si cambia habitación o estado tras fijar la lista", () => {
    const iniciales = [
      fila({
        id: "farides",
        paciente: "FARIDES",
        habitacion: "108-2",
        estado: "despachada",
      }),
      fila({
        id: "maria",
        paciente: "MARIA",
        habitacion: "104-1",
        estado: "despachada",
      }),
    ]

    const lista = sincronizarOrdenListaDietas(iniciales, new Map())
    const trasSync = [
      fila({
        id: "farides",
        paciente: "FARIDES",
        habitacion: "108-2",
        estado: "no-solicitada",
      }),
      fila({
        id: "maria",
        paciente: "MARIA",
        habitacion: "104-1",
        estado: "despachada",
      }),
    ]

    const lista2 = sincronizarOrdenListaDietas(trasSync, lista)
    const resultado = ordenarFilasDietasConListaFija(trasSync, lista2)

    // Por ubicación maria va primero; ese orden queda fijo aunque Farides pase a sin solicitud.
    expect(resultado.map((f) => f.id)).toEqual(["maria", "farides"])
  })

  it("añade filas nuevas al final sin mover las ya listadas", () => {
    const iniciales = [
      fila({ id: "a", paciente: "A", habitacion: "200" }),
    ]
    const lista = sincronizarOrdenListaDietas(iniciales, new Map())
    const conNueva = [
      fila({ id: "nueva", paciente: "NUEVA", habitacion: "100" }),
      ...iniciales,
    ]
    const lista2 = sincronizarOrdenListaDietas(conNueva, lista)
    const resultado = ordenarFilasDietasConListaFija(conNueva, lista2)

    expect(resultado.map((f) => f.id)).toEqual(["a", "nueva"])
  })
})
