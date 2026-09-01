import { describe, expect, it } from "vitest"

import {
  mapConciliacionDtoToDomain,
  mapDetalleConciliacionDto,
  mapKpisConciliacionApi,
} from "@/modules/dietas-cocina/api/mappers/conciliacion.mapper"
import type { FilaConciliacionDto } from "@/modules/dietas-cocina/types/api-dtos"

describe("mapConciliacionDtoToDomain", () => {
  it("mapea columnas Sistema/Cocina y no Cant. Fact.", () => {
    const dto: FilaConciliacionDto = {
      id: "aaaaaaaa-0001-4000-8000-000000000001",
      comida: "Desayuno",
      lineaFcr: "Normales y derivadas",
      etiquetaPlanilla: "Desayunos normales y derivadas",
      tarifa: 12345,
      cantidadSistema: 64,
      cantidadCocina: 63,
      valorSistema: 790080,
      valorCocina: 777735,
      diferenciaCantidad: -1,
      diferenciaEconomica: -12345,
      sinEtiqueta: 2,
      huerfanas: 0,
      estado: "dif-cantidad",
    }

    const fila = mapConciliacionDtoToDomain(dto)

    expect(fila.cantidadSistema).toBe(64)
    expect(fila.cantidadCocina).toBe(63)
    expect(fila.valorSistema).toBe(790080)
    expect(fila.valorCocina).toBe(777735)
    expect(fila.diferenciaCantidad).toBe(-1)
    expect(fila).not.toHaveProperty("cantFact")
    expect(fila).not.toHaveProperty("cantSist")
    expect(JSON.stringify(fila)).not.toMatch(/Cant\. Fact/)
  })

  it("conserva conciliado al mapear el DTO", () => {
    const fila = mapConciliacionDtoToDomain({
      id: "bbbbbbbb-0001-4000-8000-000000000002",
      comida: "Almuerzo",
      lineaFcr: "Normales y derivadas",
      cantidadSistema: 44,
      cantidadCocina: 44,
      estado: "conciliado",
      motivo: "Ajuste validado",
    })
    expect(fila.estado).toBe("conciliado-manual")
    expect(fila.motivo).toBe("Ajuste validado")
    expect(fila.cantidadCocina).toBe(44)
  })

  it("deja cocina vacía cuando no hay planilla", () => {
    const fila = mapConciliacionDtoToDomain({
      id: "cccccccc-0001-4000-8000-000000000003",
      comida: "Cena",
      lineaFcr: "Normales y derivadas",
      cantidadSistema: 42,
      cantidadCocina: null,
      valorCocina: null,
      estado: "pendiente",
    })
    expect(fila.cantidadCocina).toBeNull()
    expect(fila.estado).toBe("pendiente")
  })
})

describe("mapDetalleConciliacionDto", () => {
  it("compara Sistema vs Cocina, no factura del proveedor", () => {
    const detalle = mapDetalleConciliacionDto({
      linea: {
        id: "dddddddd-0001-4000-8000-000000000004",
        comida: "Desayuno",
        etiquetaPlanilla: "Desayunos normales y derivadas",
        cantidadSistema: 64,
        cantidadCocina: 63,
        valorSistema: 100,
        valorCocina: 90,
      },
      registros: [
        {
          paciente: "Durango",
          tipoClinico: "Normal",
          tieneEtiqueta: false,
          estadoDieta: "EnPreparacion",
          alertas: ["Sin etiqueta, orden en preparación"],
        },
      ],
      alertas: ["Sin etiqueta, orden en preparación"],
    })

    expect(detalle.sistema.unidades).toBe(64)
    expect(detalle.cocina.unidades).toBe(63)
    expect(detalle).not.toHaveProperty("proveedor")
    expect(detalle).not.toHaveProperty("bital")
    expect(detalle.alertas[0]).toContain("Sin etiqueta")
  })
})

describe("mapKpisConciliacionApi", () => {
  it("muestra — en cocina si aún no hay planilla", () => {
    const kpis = mapKpisConciliacionApi([
      { clave: "dietas_sistema", etiqueta: "Dietas sistema", valor: 150, formato: "numero" },
      {
        clave: "dietas_cocina",
        etiqueta: "Dietas cocina",
        valor: 0,
        formato: "numero",
        comparacion: "Cargue la planilla",
      },
      { clave: "diferencia_cantidad", etiqueta: "Diferencia de cantidad", valor: 0, formato: "numero" },
    ])
    expect(kpis.find((k) => k.label === "Dietas cocina")?.value).toBe("—")
    expect(kpis.find((k) => k.label === "Diferencia de cantidad")?.value).toBe("—")
  })
})
