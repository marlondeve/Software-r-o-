import { describe, expect, it, vi } from "vitest"

import {
  clasificarBusquedaTopbar,
  esCodigoEtiqueta,
  resolverDestinoBusquedaDietasCocina,
} from "@/lib/busquedaTopbar"

vi.mock("@/modules/dietas-cocina/lib/permisos", () => ({
  rutaDietasPermitida: (rol: string | null, ruta: string) => {
    if (rol === "Administrador") {
      return ["dietas", "bandejas-piso", "cocina", "conciliacion"].includes(ruta)
    }
    if (rol === "Enfermera") return ruta === "bandejas-piso"
    if (rol === "Proveedor") return ruta === "cocina"
    return false
  },
}))

describe("busquedaTopbar", () => {
  it("detecta códigos de etiqueta", () => {
    expect(esCodigoEtiqueta("E260731-K7M3")).toBe(true)
    expect(esCodigoEtiqueta("LBL:E260731-K7M3")).toBe(true)
    expect(clasificarBusquedaTopbar("garcia")).toBe("texto")
  })

  it("envía pacientes a gestión de dietas", () => {
    expect(
      resolverDestinoBusquedaDietasCocina("García", "Administrador"),
    ).toBe("/dietas-cocina/dietas?q=Garc%C3%ADa")
  })

  it("envía etiquetas a consulta en piso", () => {
    expect(
      resolverDestinoBusquedaDietasCocina("E260731-K7M3", "Enfermera"),
    ).toBe("/dietas-cocina/bandejas-piso/consulta/E260731-K7M3")
  })

  it("prioriza cocina si el rol no tiene acceso clínico", () => {
    expect(
      resolverDestinoBusquedaDietasCocina("301-A", "Proveedor"),
    ).toBe("/dietas-cocina/cocina?q=301-A")
  })
})
