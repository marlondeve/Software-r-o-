import { describe, expect, it } from "vitest"

import { mapNovedadToRequest } from "./filaDieta.mapper"

describe("mapNovedadToRequest", () => {
  it("envía tipoNovedad y descripcion que el API espera", () => {
    const body = mapNovedadToRequest(
      {
        tipoDieta: "Dieta Normal para la edad",
        consistencia: "Blanda",
        motivo: "Cambio clínico",
        observaciones: "Paciente con náuseas",
        pacienteAislado: false,
        alergico: false,
        comida: "almuerzo",
      },
      "catalogo-1",
    )

    expect(body.tipoNovedad).toBe("novedad_registrada")
    expect(body.descripcion).toBe("Cambio clínico")
    expect(body.motivo).toBe("Cambio clínico")
    expect(body.tipoDietaId).toBe("catalogo-1")
    expect(body.descripcionDieta).toBe("Dieta Normal para la edad")
    expect(body.consistencia).toBe("Blanda")
    expect(body.observaciones).toBe("Paciente con náuseas")
  })
})
