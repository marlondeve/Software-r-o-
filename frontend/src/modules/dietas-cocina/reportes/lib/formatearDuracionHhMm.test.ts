import { describe, expect, it } from "vitest"

import {
  formatearDuracionHhMm,
  normalizarTiempoHitoAHhMm,
} from "@/modules/dietas-cocina/reportes/lib/formatearDuracionHhMm"

describe("formatearDuracionHhMm", () => {
  it("convierte minutos a HH:MM", () => {
    expect(formatearDuracionHhMm(0)).toBe("00:00")
    expect(formatearDuracionHhMm(8)).toBe("00:08")
    expect(formatearDuracionHhMm(80)).toBe("01:20")
    expect(formatearDuracionHhMm(95)).toBe("01:35")
    expect(formatearDuracionHhMm(125)).toBe("02:05")
  })
})

describe("normalizarTiempoHitoAHhMm", () => {
  it("acepta minutos con sufijo y HH:MM", () => {
    expect(normalizarTiempoHitoAHhMm("95 min")).toBe("01:35")
    expect(normalizarTiempoHitoAHhMm("01:35")).toBe("01:35")
    expect(normalizarTiempoHitoAHhMm("1:05")).toBe("01:05")
    expect(normalizarTiempoHitoAHhMm("—")).toBe("—")
  })
})
