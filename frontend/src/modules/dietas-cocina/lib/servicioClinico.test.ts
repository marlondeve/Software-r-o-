import { describe, expect, it } from "vitest"

import {
  esServicioDescriptivo,
  inferirServicioDesdePabellon,
  resolverServicioClinico,
} from "@/modules/dietas-cocina/lib/servicioClinico"

describe("servicioClinico", () => {
  it("ignora códigos numéricos del HIS", () => {
    expect(esServicioDescriptivo("2")).toBe(false)
    expect(esServicioDescriptivo("03")).toBe(false)
  })

  it("acepta nombres legibles", () => {
    expect(esServicioDescriptivo("Hospitalización")).toBe(true)
    expect(esServicioDescriptivo("URGENCIAS")).toBe(true)
  })

  it("infiere hospitalización desde pabellón", () => {
    expect(inferirServicioDesdePabellon("HOSPITALIZACION PISO 1")).toBe(
      "Hospitalización",
    )
  })

  it("prioriza nombre descriptivo sobre código", () => {
    expect(resolverServicioClinico("Urgencias", "HOSPITALIZACION PISO 1")).toBe(
      "Urgencias",
    )
  })

  it("cae a pabellón cuando el HIS trae código", () => {
    expect(resolverServicioClinico("2", "HOSPITALIZACION PISO 1")).toBe(
      "Hospitalización",
    )
  })
})
