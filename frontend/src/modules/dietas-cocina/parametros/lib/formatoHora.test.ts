import { describe, expect, it } from "vitest"

import {
  formatearFechaHoraEnCadena,
  formatearFechaHoraLocalEtiqueta,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"

describe("formatearFechaHoraEnCadena", () => {
  it("no deja el formato ISO con T al convertir a. m./p. m.", () => {
    const result = formatearFechaHoraEnCadena("2026-08-26T20:45:00Z")
    expect(result).not.toContain("T")
    expect(result).toBe("26/08/2026 03:45 p. m.")
  })

  it("trata fecha operativa a medianoche como calendario (sin shift UTC)", () => {
    expect(formatearFechaHoraEnCadena("2026-08-26T00:00:00")).toBe("26/08/2026")
    expect(formatearFechaHoraEnCadena("2026-08-26")).toBe("26/08/2026")
  })

  it("conserva textos dd/MM/yyyy y solo normaliza la hora a 12 h", () => {
    expect(formatearFechaHoraEnCadena("24/08/2026 12:30")).toBe(
      "24/08/2026 12:30 p. m.",
    )
  })
})

describe("formatearFechaHoraLocalEtiqueta", () => {
  it("formatea un instante UTC como hora Colombia", () => {
    const fecha = new Date("2026-08-26T13:45:00Z")
    expect(formatearFechaHoraLocalEtiqueta(fecha)).toBe("26/08/2026 08:45 a. m.")
  })
})
