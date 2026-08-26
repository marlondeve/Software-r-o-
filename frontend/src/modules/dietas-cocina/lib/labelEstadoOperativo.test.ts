import { describe, expect, it } from "vitest"

import {
  esCancelacionSalidaClinica,
  labelEstadoCocinaVisible,
  labelEstadoDietaVisible,
} from "@/modules/dietas-cocina/lib/labelEstadoOperativo"

describe("labelEstadoOperativo", () => {
  it("detecta salida clínica en textos nuevos y legados", () => {
    expect(esCancelacionSalidaClinica("Paciente con salida clínica")).toBe(true)
    expect(
      esCancelacionSalidaClinica(
        "Cancelada automáticamente: salida clínica HIS (IngInSlC = S)",
      ),
    ).toBe(true)
    expect(
      esCancelacionSalidaClinica(
        "Dieta cancelada automáticamente por egreso del paciente",
      ),
    ).toBe(true)
    expect(
      esCancelacionSalidaClinica(
        "Cancelada automáticamente: paciente egresado del censo",
      ),
    ).toBe(true)
    expect(esCancelacionSalidaClinica(undefined, true)).toBe(true)
    expect(esCancelacionSalidaClinica("Cancelada: [otro] motivo")).toBe(false)
  })

  it("muestra Salida clínica en lugar de Cancelada", () => {
    expect(
      labelEstadoDietaVisible("cancelada", {
        observaciones: "Paciente con salida clínica",
      }),
    ).toBe("Salida clínica")
    expect(labelEstadoDietaVisible("cancelada")).toBe("Cancelada")
    expect(
      labelEstadoCocinaVisible("cancelada", {
        observaciones: "salida clínica",
      }),
    ).toBe("Salida clínica")
  })
})
