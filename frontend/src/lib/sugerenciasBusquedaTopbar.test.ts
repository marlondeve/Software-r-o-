import { describe, expect, it, vi } from "vitest"

import {
  combinarSugerencias,
  filasASugerenciasPaciente,
  pareceBusquedaEtiqueta,
  sugerenciaVerTodos,
} from "@/lib/sugerenciasBusquedaTopbar"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

vi.mock("@/modules/dietas-cocina/lib/permisos", () => ({
  rutaDietasPermitida: (rol: string | null, ruta: string) => {
    if (rol === "Administrador") {
      return ["dietas", "bandejas-piso", "cocina"].includes(ruta)
    }
    return false
  },
}))

const filaMock: FilaDieta = {
  id: "f1",
  pacienteId: "p1",
  paciente: "García, María",
  edad: 45,
  servicio: "Medicina Interna",
  pabellon: "Pab. Central",
  habitacion: "301-A",
  consistencia: null,
  tipoDieta: null,
  aislamiento: "",
  alergico: false,
  alergias: "",
  observacionAislamiento: "",
  observaciones: "",
  estado: "no-solicitada",
  comida: "desayuno",
}

describe("sugerenciasBusquedaTopbar", () => {
  it("detecta búsquedas parciales de etiqueta", () => {
    expect(pareceBusquedaEtiqueta("E260731")).toBe(true)
    expect(pareceBusquedaEtiqueta("garcia")).toBe(false)
  })

  it("convierte filas de dietas en sugerencias de paciente", () => {
    const sugerencias = filasASugerenciasPaciente([filaMock], "Administrador")
    expect(sugerencias).toHaveLength(1)
    expect(sugerencias[0]?.titulo).toBe("García, María")
    expect(sugerencias[0]?.destino).toContain("/dietas-cocina/dietas?q=")
  })

  it("agrega acción ver todos sin duplicar", () => {
    const accion = sugerenciaVerTodos("dietas-cocina", "301", "Administrador")
    const resultado = combinarSugerencias(
      filasASugerenciasPaciente([filaMock], "Administrador"),
      accion ? [accion] : [],
    )
    expect(resultado.length).toBeGreaterThanOrEqual(2)
    expect(resultado.some((item) => item.tipo === "accion")).toBe(true)
  })
})
