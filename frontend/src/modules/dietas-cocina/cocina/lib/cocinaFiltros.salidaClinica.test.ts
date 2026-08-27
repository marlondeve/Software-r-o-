import { describe, expect, it } from "vitest"

import {
  calcularKpisCocina,
  esOrdenCanceladaManual,
  esOrdenSalidaClinica,
  filtrosDesdeKpiCocina,
  ordenCoincideFiltros,
  type FiltrosCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaFiltros"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"

function orden(parcial: Partial<OrdenCocina> = {}): OrdenCocina {
  return {
    id: "o-1",
    pacienteId: "P-1",
    paciente: "Paciente",
    edad: 40,
    pabellon: "Piso 3",
    habitacion: "301",
    tipoDieta: "Corriente",
    consistencia: "Normal",
    comida: "almuerzo",
    aislado: false,
    alergias: [],
    observaciones: "",
    estadoCocina: "en_preparacion",
    etiquetaImpresa: false,
    etiquetaGenerada: false,
    checklist: [],
    ...parcial,
  }
}

const FILTROS_BASE: FiltrosCocina = {
  pabellon: "Todos",
  habitacion: "Todas",
  tipoDieta: "Todos",
  consistencia: "Todas",
  estadoCocina: "Todos",
  seguimiento: "Todos",
  soloAislados: false,
  busqueda: "",
}

const salidaClinica = orden({
  id: "o-salida",
  estadoCocina: "cancelada",
  cancelacionPorSalidaClinica: true,
})

const salidaSoloObservacion = orden({
  id: "o-salida-obs",
  estadoCocina: "cancelada",
  observaciones: "Cancelada automáticamente por egreso del paciente",
})

const canceladaManual = orden({
  id: "o-cancelada",
  estadoCocina: "cancelada",
  observaciones: "Cancelada por indicación médica",
})

describe("clasificación de bandejas canceladas", () => {
  it("separa la salida clínica de la cancelación manual", () => {
    expect(esOrdenSalidaClinica(salidaClinica)).toBe(true)
    expect(esOrdenCanceladaManual(salidaClinica)).toBe(false)

    expect(esOrdenSalidaClinica(canceladaManual)).toBe(false)
    expect(esOrdenCanceladaManual(canceladaManual)).toBe(true)
  })

  it("reconoce la salida clínica también por observaciones, sin el flag", () => {
    expect(esOrdenSalidaClinica(salidaSoloObservacion)).toBe(true)
    expect(esOrdenCanceladaManual(salidaSoloObservacion)).toBe(false)
  })

  it("no clasifica como baja una bandeja activa", () => {
    const activa = orden({ observaciones: "Paciente con salida clínica" })
    expect(esOrdenSalidaClinica(activa)).toBe(false)
    expect(esOrdenCanceladaManual(activa)).toBe(false)
  })
})

describe("filtro de estado en cocina", () => {
  it("el filtro de salida clínica excluye las cancelaciones manuales", () => {
    const filtros = { ...FILTROS_BASE, estadoCocina: "salida_clinica" }
    expect(ordenCoincideFiltros(salidaClinica, filtros)).toBe(true)
    expect(ordenCoincideFiltros(canceladaManual, filtros)).toBe(false)
  })

  it("el filtro de canceladas excluye las salidas clínicas", () => {
    const filtros = { ...FILTROS_BASE, estadoCocina: "cancelada" }
    expect(ordenCoincideFiltros(canceladaManual, filtros)).toBe(true)
    expect(ordenCoincideFiltros(salidaClinica, filtros)).toBe(false)
  })

  it("cada KPI de baja apunta a su propio filtro", () => {
    expect(filtrosDesdeKpiCocina("salidas-clinicas").estadoCocina).toBe(
      "salida_clinica",
    )
    expect(filtrosDesdeKpiCocina("canceladas").estadoCocina).toBe("cancelada")
  })
})

describe("KPIs de cocina", () => {
  it("cuenta salidas clínicas y canceladas por separado y fuera del total", () => {
    const kpis = calcularKpisCocina(
      [orden(), salidaClinica, salidaSoloObservacion, canceladaManual],
      "almuerzo",
    )
    const valor = (id: string) => kpis.find((kpi) => kpi.id === id)?.value

    expect(valor("salidas-clinicas")).toBe(2)
    expect(valor("canceladas")).toBe(1)
    // El total refleja lo que cocina debe producir: ninguna baja entra.
    expect(valor("total")).toBe(1)
  })

  it("ignora las bandejas de otra comida", () => {
    const kpis = calcularKpisCocina(
      [{ ...salidaClinica, comida: "cena" }, canceladaManual],
      "almuerzo",
    )
    const valor = (id: string) => kpis.find((kpi) => kpi.id === id)?.value

    expect(valor("salidas-clinicas")).toBe(0)
    expect(valor("canceladas")).toBe(1)
  })
})
