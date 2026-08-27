import { describe, expect, it } from "vitest"

import { minutosDelDiaEnColombia } from "@/modules/dietas-cocina/parametros/lib/horasOperativas"

describe("minutosDelDiaEnColombia", () => {
  it("usa hora Colombia, no la zona del Date local", () => {
    // 20:10 UTC = 15:10 en Bogotá (UTC-5)
    const fecha = new Date("2026-08-26T20:10:00Z")
    expect(minutosDelDiaEnColombia(fecha)).toBe(15 * 60 + 10)
  })
})
