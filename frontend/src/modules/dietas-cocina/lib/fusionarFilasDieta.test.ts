import { describe, expect, it } from "vitest"

import { fusionarFilasPorComida, deduplicarFilasPorPacienteComida, reemplazarFilaPorIdOIdentidad } from "@/modules/dietas-cocina/lib/fusionarFilasDieta"
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

  it("conserva filas locales ausentes del snapshot (ausencia no es egreso)", () => {
    const locales = [
      filaBase("1"),
      filaBase("ausente", { pacienteId: "PAC-AUSENTE", estado: "lista-despacho" }),
    ]
    const remotas = [filaBase("1")]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result).toHaveLength(2)
    expect(result.map((f) => f.pacienteId)).toContain("PAC-AUSENTE")
  })

  it("conserva el censo local si el API responde vacío", () => {
    const locales = [filaBase("1", { estado: "en-preparacion" })]

    expect(fusionarFilasPorComida(locales, [], "desayuno")).toEqual(locales)
  })

  it("aplica cancelación remota (IngInSlC=S) aunque el estado local esté más avanzado", () => {
    const locales = [filaBase("1", { estado: "lista-despacho" })]
    const remotas = [filaBase("1", { estado: "cancelada" })]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result).toHaveLength(1)
    expect(result[0].estado).toBe("cancelada")
  })

  it("al reingresar aplica el estado remoto activo sobre la cancelación local", () => {
    const locales = [filaBase("1", { estado: "cancelada" })]
    const remotas = [filaBase("1", { estado: "confirmada", habitacion: "205" })]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result).toHaveLength(1)
    expect(result[0].estado).toBe("confirmada")
    expect(result[0].habitacion).toBe("205")
  })

  it("al reingresar también acepta volver a no-solicitada para pedir de nuevo", () => {
    const locales = [filaBase("1", { estado: "cancelada" })]
    const remotas = [filaBase("1", { estado: "no-solicitada" })]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result[0].estado).toBe("no-solicitada")
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

  it("no duplica la fila cuando el API la trae y ya existía local", () => {
    const locales = [filaBase("1", { estado: "en-preparacion" })]
    const remotas = [filaBase("1", { estado: "confirmada" })]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result.filter((f) => f.pacienteId === "PAC-1")).toHaveLength(1)
  })

  it("reactiva y no conserva cancelada legada con otro formato de pacienteId", () => {
    const locales = [
      filaBase("vieja", {
        pacienteId: "123456",
        estado: "cancelada",
        observaciones: "Cancelada automáticamente: paciente egresado del censo",
      }),
    ]
    const remotas = [
      filaBase("nueva", {
        pacienteId: "CC-123456",
        estado: "no-solicitada",
      }),
    ]

    const result = fusionarFilasPorComida(locales, remotas, "desayuno")

    expect(result).toHaveLength(1)
    expect(result[0].pacienteId).toBe("CC-123456")
    expect(result[0].estado).toBe("no-solicitada")
  })

  it("deduplica por cédula aunque pacienteId sea distinto", () => {
    const result = deduplicarFilasPorPacienteComida([
      filaBase("sin-sol", {
        pacienteId: "legacy-78714472",
        cedula: "78714472",
        estado: "no-solicitada",
        paciente: "DAGOBERTO",
      }),
      filaBase("despachada", {
        pacienteId: "CC-78714472",
        cedula: "78714472",
        estado: "despachada",
        paciente: "DAGOBERTO",
      }),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("despachada")
    expect(result[0].estado).toBe("despachada")
  })

  it("prefiere la fila con estado visible más avanzado", () => {
    const filas = [
      filaBase("guardada", {
        pacienteId: "legacy-78714472",
        cedula: "78714472",
        estado: "guardado",
      }),
      filaBase("con-orden", {
        pacienteId: "CC-78714472",
        cedula: "78714472",
        estado: "no-solicitada",
      }),
    ]

    const result = deduplicarFilasPorPacienteComida(filas, (fila) =>
      fila.id === "con-orden" ? "despachada" : fila.estado,
    )

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("con-orden")
  })
})

describe("reemplazarFilaPorIdOIdentidad", () => {
  it("sustituye por id y no duplica", () => {
    const previas = [filaBase("a", { estado: "confirmada", cedula: "12345678" })]
    const result = reemplazarFilaPorIdOIdentidad(previas, filaBase("a", {
      estado: "en-preparacion",
      cedula: "12345678",
    }))
    expect(result).toHaveLength(1)
    expect(result[0].estado).toBe("en-preparacion")
  })

  it("si el id es otro, reemplaza por cédula+comida+fecha", () => {
    const previas = [filaBase("viejo", {
      pacienteId: "PAC-X",
      cedula: "78714472",
      comida: "almuerzo",
      fechaOperativa: "2026-08-27",
      estado: "confirmada",
    })]
    const result = reemplazarFilaPorIdOIdentidad(previas, filaBase("nuevo", {
      pacienteId: "PAC-Y",
      cedula: "78714472",
      comida: "almuerzo",
      fechaOperativa: "2026-08-27",
      estado: "en-preparacion",
    }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("nuevo")
    expect(result[0].estado).toBe("en-preparacion")
  })
})
