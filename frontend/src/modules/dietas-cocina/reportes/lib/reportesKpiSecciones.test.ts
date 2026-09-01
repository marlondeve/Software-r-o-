import { describe, expect, it } from "vitest"

import {
  agruparKpisReporte,
  kpisTienenClavesApi,
} from "@/modules/dietas-cocina/reportes/lib/reportesKpiSecciones"

describe("reportesKpiSecciones", () => {
  const kpisApi = [
    {
      clave: "dietas_producidas_periodo",
      label: "Dietas producidas período",
      value: "150",
      detalleVariant: "neutral" as const,
    },
    {
      clave: "costo_total_facturado",
      label: "Costo total facturado",
      value: "$1.828.047,00 COP",
      detalleVariant: "neutral" as const,
    },
    {
      clave: "costo_dietas_producidas",
      label: "Costo dietas producidas",
      value: "$1.828.047,00 COP",
      detalleVariant: "neutral" as const,
    },
    {
      clave: "costo_retrasos",
      label: "Costo por retrasos",
      value: "$176.065,00 COP",
      detalleVariant: "neutral" as const,
    },
    {
      clave: "total_dietas_periodo",
      label: "Pacientes en censo",
      value: "798",
      detalleVariant: "neutral" as const,
    },
  ]

  it("agrupa producción con sección destacada de cocina", () => {
    const secciones = agruparKpisReporte(kpisApi, "produccion")
    expect(secciones[0]?.id).toBe("cocina")
    expect(secciones[0]?.kpis.map((k) => k.clave)).toEqual([
      "dietas_producidas_periodo",
      "costo_total_facturado",
    ])
    expect(secciones.some((s) => s.id === "referencia")).toBe(true)
  })

  it("oculta costo_dietas_producidas duplicado", () => {
    const secciones = agruparKpisReporte(kpisApi, "produccion")
    const todas = secciones.flatMap((s) => s.kpis)
    expect(todas.some((k) => k.clave === "costo_dietas_producidas")).toBe(false)
  })

  it("separa censo de cocina en reporte clínico", () => {
    const secciones = agruparKpisReporte(kpisApi, "clinico")
    const cocina = secciones.find((s) => s.id === "cocina")
    const censo = secciones.find((s) => s.id === "censo")
    expect(cocina?.kpis.some((k) => k.clave === "dietas_producidas_periodo")).toBe(true)
    expect(censo?.kpis.some((k) => k.clave === "total_dietas_periodo")).toBe(true)
  })

  it("detecta KPIs con clave de API", () => {
    expect(kpisTienenClavesApi(kpisApi)).toBe(true)
    expect(
      kpisTienenClavesApi([
        { label: "Mock", value: "1", detalleVariant: "neutral" },
      ]),
    ).toBe(false)
  })
})
