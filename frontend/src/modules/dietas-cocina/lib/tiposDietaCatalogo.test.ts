import { describe, expect, it } from "vitest"

import { tiposDietaParaComida } from "@/modules/dietas-cocina/lib/tiposDietaCatalogo"
import type { CatalogoDietaItem } from "@/modules/dietas-cocina/types/repositories"

const catalogoFcr: CatalogoDietaItem[] = [
  {
    id: "1",
    nombre: "Normales y derivadas",
    tarifasVigentes: { desayuno: 9766, almuerzo: 12479, cena: 12479 },
  },
  {
    id: "4",
    nombre: "Renal",
    tarifasVigentes: { almuerzo: 12021, cena: 12646 },
  },
  {
    id: "10",
    nombre: "Merienda mañana",
    tarifasVigentes: { "merienda-manana": 6080 },
  },
]

describe("tiposDietaParaComida", () => {
  it("excluye Renal en desayuno por falta de tarifa", () => {
    const tipos = tiposDietaParaComida("desayuno", catalogoFcr)
    expect(tipos).toContain("Normales y derivadas")
    expect(tipos).not.toContain("Renal")
    expect(tipos).not.toContain("Merienda mañana")
  })

  it("incluye Renal en almuerzo", () => {
    const tipos = tiposDietaParaComida("almuerzo", catalogoFcr)
    expect(tipos).toContain("Renal")
  })

  it("solo muestra merienda mañana en merienda-manana", () => {
    const tipos = tiposDietaParaComida("merienda-manana", catalogoFcr)
    expect(tipos).toEqual(["Merienda mañana"])
  })
})
