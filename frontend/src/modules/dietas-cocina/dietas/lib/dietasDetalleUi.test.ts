import { describe, expect, it } from "vitest"

import { preferirNombreSolicitante } from "./dietasDetalleUi"

describe("preferirNombreSolicitante", () => {
  it("conserva el nombre completo si el censo trae la cédula", () => {
    expect(preferirNombreSolicitante("33227614", "María Pérez")).toBe("María Pérez")
  })

  it("conserva el nombre si el censo trae el usuario de login", () => {
    expect(preferirNombreSolicitante("amartinez", "Alberto Martínez")).toBe(
      "Alberto Martínez",
    )
  })

  it("usa el nombre fresco del censo cuando ambos son nombres", () => {
    expect(preferirNombreSolicitante("Ana López", "María Pérez")).toBe("Ana López")
  })

  it("devuelve el único valor disponible", () => {
    expect(preferirNombreSolicitante("33227614", undefined)).toBe("33227614")
    expect(preferirNombreSolicitante(undefined, "María Pérez")).toBe("María Pérez")
  })
})
