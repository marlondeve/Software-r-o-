import { describe, expect, it } from "vitest"

import { chartColorHex, segmentoOrdenReporteColores } from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"
import { estadoBadgeTokens } from "@/modules/dietas-cocina/lib/estadosEstilos"

describe("reportesEstilos", () => {
  it("alinea segmentos de orden con tokens semánticos de badges", () => {
    expect(segmentoOrdenReporteColores.enCocina).toBe(chartColorHex.progress)
    expect(segmentoOrdenReporteColores.despachadas).toBe(chartColorHex.info)
    expect(segmentoOrdenReporteColores.rechazadas).toBe(chartColorHex.danger)
    expect(estadoBadgeTokens.progress).toContain("orange")
    expect(estadoBadgeTokens.info).toContain("sky")
  })

  it("usa primary brand para success", () => {
    expect(chartColorHex.success).toBe("#006671")
  })
})
