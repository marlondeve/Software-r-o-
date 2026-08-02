import { describe, expect, it } from "vitest"

import {
  claseBadgeEstadoCocina,
  claseBadgeEstadoDieta,
  claseBadgeLogistica,
  estadoBadgeTokens,
} from "@/modules/dietas-cocina/lib/estadosEstilos"

describe("estadosEstilos", () => {
  it("usa el mismo token para En gestión en dietas y cocina", () => {
    expect(claseBadgeEstadoDieta("en-preparacion")).toBe(estadoBadgeTokens.progress)
    expect(claseBadgeEstadoCocina("en_preparacion")).toBe(estadoBadgeTokens.progress)
  })

  it("usa danger para devuelta en dietas y logística", () => {
    expect(claseBadgeEstadoDieta("devuelta")).toBe(estadoBadgeTokens.danger)
    expect(claseBadgeLogistica("devuelta")).toBe(estadoBadgeTokens.danger)
  })

  it("usa info para despachada", () => {
    expect(claseBadgeEstadoDieta("despachada")).toBe(estadoBadgeTokens.info)
    expect(claseBadgeEstadoCocina("despachada")).toBe(estadoBadgeTokens.info)
  })

  it("usa transit para recibida y pre_entregada", () => {
    expect(claseBadgeEstadoDieta("recibida")).toBe(estadoBadgeTokens.transit)
    expect(claseBadgeLogistica("pre_entregada")).toBe(estadoBadgeTokens.transit)
  })
})
