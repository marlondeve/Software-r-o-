import { describe, expect, it } from "vitest"

import {
  esServicioDescriptivo,
  inferirServicioDesdePabellon,
  resolverServicioClinico,
  servicioCoincideFila,
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

  it("prioriza UCI del pabellón aunque el HIS diga hospitalización", () => {
    expect(resolverServicioClinico("Hospitalización", "UCI ADULTO")).toBe("UCI")
    expect(resolverServicioClinico("2", "UCI PEDIATRICA")).toBe("UCI")
  })

  it("prioriza nombre descriptivo sobre código cuando no hay especialidad", () => {
    expect(resolverServicioClinico("Urgencias", "HOSPITALIZACION PISO 1")).toBe(
      "Urgencias",
    )
  })

  it("cae a pabellón cuando el HIS trae código", () => {
    expect(resolverServicioClinico("2", "HOSPITALIZACION PISO 1")).toBe(
      "Hospitalización",
    )
  })

  it("filtra UCI incluyendo variantes de pabellón", () => {
    expect(
      servicioCoincideFila(
        { servicio: "Hospitalización", pabellon: "UCI ADULTO" },
        "UCI",
      ),
    ).toBe(true)
    expect(
      servicioCoincideFila(
        { servicio: "Hospitalización", pabellon: "HOSPITALIZACION PISO 1" },
        "UCI",
      ),
    ).toBe(false)
  })
})
