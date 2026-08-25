import { describe, expect, it } from "vitest"

import {
  clasificarEtiquetaRespectoCenso,
  filtrarEtiquetasEnFlujoCenso,
} from "@/modules/dietas-cocina/lib/clasificarEtiquetaCenso"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"

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
    estado: "despachada",
    comida: "desayuno",
    ...overrides,
  }
}

function etiquetaBase(
  overrides: Partial<EtiquetaEnfermera> = {},
): EtiquetaEnfermera {
  return {
    id: "etq-1",
    codigo: "ETQ-1",
    pacienteId: "PAC-1",
    paciente: "Paciente Test",
    documento: "123",
    edad: 40,
    aislamiento: false,
    pabellon: "P1",
    habitacion: "101",
    tipoDieta: "Normal",
    consistencia: "Normal",
    observaciones: "",
    comida: "desayuno",
    estado: "impresa",
    estadoLogistica: "impresa",
    fechaHora: `${fechaOperativaHoy()} 07:00`,
    qrPayload: "ETQ-1",
    filaDietaId: "fila-1",
    ...overrides,
  }
}

describe("clasificarEtiquetaRespectoCenso", () => {
  it("sin filas cargadas no degrada a fuera de censo", () => {
    expect(clasificarEtiquetaRespectoCenso(etiquetaBase(), []).enFlujo).toBe(
      true,
    )
  })

  it("marca en flujo cuando hay fila activa", () => {
    const filas = [filaBase("fila-1")]
    expect(clasificarEtiquetaRespectoCenso(etiquetaBase(), filas)).toEqual({
      enFlujo: true,
      fila: filas[0],
    })
  })

  it("marca cancelada cuando la dieta está cancelada", () => {
    const filas = [filaBase("fila-1", { estado: "cancelada" })]
    const result = clasificarEtiquetaRespectoCenso(etiquetaBase(), filas)
    expect(result.enFlujo).toBe(false)
    expect(result.motivo).toBe("cancelada")
  })

  it("marca fuera de censo cuando el paciente ya no está en filas", () => {
    const result = clasificarEtiquetaRespectoCenso(etiquetaBase(), [
      filaBase("otra-fila"),
    ])
    expect(result).toEqual({ enFlujo: false, motivo: "fuera_de_censo" })
  })

  it("filtra KPIs a solo etiquetas en flujo (caso 15→12)", () => {
    const filas = [
      filaBase("f1"),
      filaBase("f2", { pacienteId: "P2" }),
      filaBase("f3", { pacienteId: "P3", estado: "cancelada" }),
    ]
    const etiquetas = [
      etiquetaBase({ id: "a", filaDietaId: "f1" }),
      etiquetaBase({ id: "b", filaDietaId: "f2", codigo: "ETQ-2" }),
      etiquetaBase({ id: "c", filaDietaId: "f3", codigo: "ETQ-3" }),
      etiquetaBase({ id: "d", filaDietaId: "egresado", codigo: "ETQ-4" }),
      etiquetaBase({ id: "e", filaDietaId: "egresado-2", codigo: "ETQ-5" }),
    ]
    expect(filtrarEtiquetasEnFlujoCenso(etiquetas, filas)).toHaveLength(2)
    expect(etiquetas).toHaveLength(5)
  })
})
