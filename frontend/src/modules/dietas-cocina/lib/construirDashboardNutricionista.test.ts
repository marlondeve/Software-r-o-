import { describe, expect, it } from "vitest"

import { construirDashboardNutricionistaDesdeCiclo } from "@/modules/dietas-cocina/lib/construirDashboardNutricionista"
import { mesclarDashboardNutricionista } from "@/modules/dietas-cocina/lib/mesclarDashboardOperativo"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function filaBase(id: string, overrides: Partial<FilaDieta> = {}): FilaDieta {
  return {
    id,
    pacienteId: `CC-${id}`,
    cedula: id.padStart(8, "0"),
    tipoDocumento: "CC",
    paciente: `Paciente ${id}`,
    edad: 50,
    servicio: "Hospitalización",
    pabellon: "Piso 1",
    habitacion: id,
    consistencia: null,
    tipoDieta: null,
    aislado: false,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "no-solicitada",
    comida: "almuerzo",
    ...overrides,
  }
}

/** 12:15 → periodo de almuerzo (solicitud 10:00, fin-dist 13:30). */
const ALMUERZO = new Date(2026, 7, 26, 12, 15, 0)

describe("construirDashboardNutricionistaDesdeCiclo", () => {
  it("alinea KPIs con el censo único: activos + salidas = total del donut", () => {
    const filas: FilaDieta[] = [
      ...Array.from({ length: 12 }, (_, i) =>
        filaBase(`d${i + 1}`, {
          estado: "confirmada",
          tipoDieta: "Normal",
          consistencia: "Normal",
        }),
      ),
      ...Array.from({ length: 9 }, (_, i) =>
        filaBase(`p${i + 1}`, { estado: "no-solicitada" }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        filaBase(`s${i + 1}`, {
          estado: "cancelada",
          cancelacionPorSalidaClinica: true,
          observaciones: "Paciente con salida clínica",
        }),
      ),
      // Duplicado legado: no debe inflar KPIs ni el donut.
      filaBase("d1", {
        id: "d1-dup",
        estado: "no-solicitada",
      }),
    ]

    const data = construirDashboardNutricionistaDesdeCiclo(filas, [], [], ALMUERZO)
    const valor = (label: string) =>
      Number(data.kpis.find((k) => k.label === label)?.value ?? -1)

    expect(valor("Pacientes activos")).toBe(21)
    expect(valor("Dietas pendientes")).toBe(9)
    expect(valor("Confirmadas")).toBe(12)
    expect(valor("Novedades")).toBe(0)
    expect(valor("Salidas clínicas")).toBe(4)
    expect(valor("Canceladas")).toBe(0)
    expect(data.distribucion.total).toBe(25)
    expect(data.distribucion.segmentos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Confirmada", value: 12 }),
        expect.objectContaining({ label: "Sin solicitud", value: 9 }),
        expect.objectContaining({ label: "Salida clínica", value: 4 }),
      ]),
    )
  })
})

describe("mesclarDashboardNutricionista", () => {
  it("no sustituye los KPIs operativos por totales crudos del API", () => {
    const ciclo = construirDashboardNutricionistaDesdeCiclo(
      [
        filaBase("1", { estado: "confirmada", tipoDieta: "Normal" }),
        filaBase("2", { estado: "no-solicitada" }),
      ],
      [],
      [],
      ALMUERZO,
    )

    const mezclado = mesclarDashboardNutricionista(
      {
        periodoOperativo: "—",
        kpis: [
          { label: "Total dietas", value: "3545", variant: "default" },
          { label: "Dietas activas", value: "3538", variant: "default" },
        ],
        distribucion: {
          total: 3545,
          segmentos: [{ label: "Basura", value: 3545, color: "#000" }],
        },
        atencion: [],
        actividadReciente: [],
        proximoCierre: {
          servicio: "—",
          hora: "—",
          tiempoRestante: "—",
          pendientes: 0,
        },
      },
      ciclo,
    )

    expect(mezclado.kpis).toEqual(ciclo.kpis)
    expect(mezclado.distribucion).toEqual(ciclo.distribucion)
    expect(mezclado.kpis.some((k) => k.label === "Total dietas")).toBe(false)
  })
})
