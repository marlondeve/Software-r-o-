import { describe, expect, it } from "vitest"

import { construirConciliacionDesdeCiclo } from "@/modules/dietas-cocina/lib/construirConciliacionDesdeCiclo"
import { PLANTILLA_FCR } from "@/modules/dietas-cocina/lib/contratoCocina"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EstadoCocina, TiempoComida } from "@/modules/dietas-cocina/types/enums"

function orden(parcial: {
  comida: TiempoComida
  tipoDieta: string
  estadoCocina: EstadoCocina
  etiqueta?: boolean
}): OrdenCocina {
  return {
    id: crypto.randomUUID(),
    pacienteId: "p1",
    paciente: "Paciente",
    edad: 40,
    pabellon: "Central",
    habitacion: "101",
    tipoDieta: parcial.tipoDieta,
    consistencia: "Normal",
    comida: parcial.comida,
    aislado: false,
    alergias: [],
    observaciones: "",
    estadoCocina: parcial.estadoCocina,
    etiquetaImpresa: parcial.etiqueta ?? true,
    etiquetaGenerada: parcial.etiqueta ?? true,
    checklist: [],
  }
}

describe("construirConciliacionDesdeCiclo", () => {
  it("agrupa hiposódica en Normales y derivadas, no por tipo clínico", () => {
    const filas = construirConciliacionDesdeCiclo([
      orden({
        comida: "almuerzo",
        tipoDieta: "Hiposódica",
        estadoCocina: "despachada",
      }),
    ])
    const linea = filas.find(
      (f) => f.comida === "Almuerzo" && f.lineaFcr === "Normales y derivadas",
    )
    expect(linea?.cantidadSistema).toBe(1)
    expect(filas).toHaveLength(PLANTILLA_FCR.length)
    expect(filas.some((f) => f.lineaFcr === "Hiposódica")).toBe(false)
  })

  it("no inventa cantidad cocina ni Cant. Fact.", () => {
    const filas = construirConciliacionDesdeCiclo([
      orden({ comida: "desayuno", tipoDieta: "Normal", estadoCocina: "en_preparacion" }),
    ])
    expect(filas.every((f) => f.cantidadCocina === null)).toBe(true)
    expect(JSON.stringify(filas)).not.toMatch(/cantFact/)
  })
})
