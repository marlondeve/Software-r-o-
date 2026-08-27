import { describe, expect, it } from "vitest"

import {
  esCancelacionSalidaClinica,
  esSalidaClinicaSostenida,
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

  it("muestra Salida clínica cuando la baja fue por egreso HIS", () => {
    expect(
      labelEstadoDietaVisible("cancelada", {
        observaciones: "Paciente con salida clínica",
        cancelacionPorSalidaClinica: true,
      }),
    ).toBe("Salida clínica")
    expect(labelEstadoDietaVisible("cancelada")).toBe("Cancelada")
    expect(
      labelEstadoCocinaVisible("cancelada", {
        observaciones: "Paciente con salida clínica",
      }),
    ).toBe("Salida clínica")
    expect(labelEstadoCocinaVisible("cancelada")).toBe("Cancelada")
    expect(
      labelEstadoCocinaVisible("cancelada", {
        observaciones: "Cancelada por indicación médica",
      }),
    ).toBe("Cancelada")
  })

  it("no confunde salida clínica sostenida con cancelación aunque el texto mezcle ambos", () => {
    const obs =
      "Paciente con salida clínica\nSalida clínica fuera del límite de novedades: la dieta se mantiene y el proveedor la envía"
    expect(esCancelacionSalidaClinica(obs, true, true, "confirmada")).toBe(false)
    expect(esCancelacionSalidaClinica(obs, true, true, "cancelada")).toBe(true)
    expect(
      labelEstadoDietaVisible("confirmada", {
        salidaClinicaSostenida: true,
        observaciones: obs,
      }),
    ).toBe("Salida clínica · asume la clínica")
    expect(
      labelEstadoDietaVisible("cancelada", {
        salidaClinicaSostenida: true,
        observaciones: obs,
      }),
    ).toBe("Salida clínica")
  })

  it("no cuenta Guardado como sostenida aunque tenga flag o texto", () => {
    expect(
      esSalidaClinicaSostenida({
        estado: "guardado",
        salidaClinicaSostenida: true,
        observaciones:
          "Salida clínica: la dieta se mantiene y el proveedor la envía (asume la clínica)",
      }),
    ).toBe(false)
    expect(
      labelEstadoDietaVisible("guardado", {
        salidaClinicaSostenida: true,
        observaciones:
          "Salida clínica: la dieta se mantiene y el proveedor la envía (asume la clínica)",
      }),
    ).toBe("Guardado")
  })

  it("sí marca asumida solo si ya está en cocina", () => {
    expect(
      labelEstadoDietaVisible("lista-despacho", {
        salidaClinicaSostenida: true,
      }),
    ).toBe("Salida clínica · asume la clínica")
    expect(
      labelEstadoDietaVisible("despachada", {
        salidaClinicaSostenida: true,
      }),
    ).toBe("Salida clínica · asume la clínica")
  })
})
