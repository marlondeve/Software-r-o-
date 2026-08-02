import { describe, expect, it } from "vitest"

import { formatearCambiosAuditoria } from "@/modules/dietas-cocina/auditoria/lib/formatearCambiosAuditoria"

describe("formatearCambiosAuditoria", () => {
  it("humaniza entrega de etiqueta", () => {
    const resultado = formatearCambiosAuditoria(
      null,
      JSON.stringify({
        estadoLogistica: "entregada",
        entregadoPor: "admin",
        codigo: "E260802-G9FG",
      }),
    )

    expect(resultado.resumen).toContain("Estado logístico")
    expect(resultado.cambios.some((c) => c.campo === "Estado logístico")).toBe(true)
    expect(resultado.cambios.some((c) => c.nuevo === "Entregada")).toBe(true)
  })

  it("humaniza generación masiva de etiquetas", () => {
    const resultado = formatearCambiosAuditoria(
      null,
      JSON.stringify({
        count: 3,
        ordenIds: ["4b8d8da7-0000-0000-0000-000000000001"],
        etiquetasIds: ["d14837b9-0000-0000-0000-000000000002"],
      }),
    )

    expect(resultado.resumen).toBe("Se registraron 3 etiquetas")
    expect(resultado.cambios.find((c) => c.campo === "Cantidad")?.nuevo).toBe("3")
  })

  it("humaniza confirmación de dieta con diff de estado", () => {
    const resultado = formatearCambiosAuditoria(
      JSON.stringify({ estado: "Solicitada" }),
      JSON.stringify({ estado: "Confirmada", consistencia: "Blanda" }),
    )

    expect(resultado.resumen).toContain("Estado")
    expect(resultado.resumen).toContain("Solicitada")
    expect(resultado.resumen).toContain("Confirmada")
    expect(resultado.cambios.some((c) => c.campo === "Consistencia")).toBe(true)
  })

  it("resume arrays de UUIDs sin mostrar ids completos", () => {
    const resultado = formatearCambiosAuditoria(
      null,
      JSON.stringify({ ordenIds: ["aaaa-bbbb-cccc-dddd-eeeeeeeeeeee"] }),
    )

    const orden = resultado.cambios.find((c) => c.campo === "Órdenes")
    expect(orden?.nuevo).toBe("1 registro")
  })

  it("conserva json técnico formateado", () => {
    const payload = JSON.stringify({ estado: "Confirmada" })
    const resultado = formatearCambiosAuditoria(null, payload)

    expect(resultado.jsonTecnico?.despues).toContain('"estado"')
    expect(resultado.jsonTecnico?.despues).toContain("Confirmada")
  })
})
