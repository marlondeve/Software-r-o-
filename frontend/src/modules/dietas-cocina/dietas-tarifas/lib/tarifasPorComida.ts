import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { TarifaHistorico } from "@/modules/dietas-cocina/types/catalog"
import { mapearComidaApi, mapearComidaInterna } from "@/modules/dietas-cocina/api/utils"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { formatearMonedaTarifa } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

export type TarifasPorComidaForm = Record<TiempoComida, string>

export const TARIFAS_POR_COMIDA_VACIAS = Object.fromEntries(
  COMIDAS_TABS.map((comida) => [comida.id, ""]),
) as TarifasPorComidaForm

export interface TarifaComidaPayload {
  tiempoComida: string
  monto: number
}

export function tarifasVigentesDesdeHistorico(
  historico: TarifaHistorico[],
): Partial<Record<TiempoComida, number>> {
  const tarifas: Partial<Record<TiempoComida, number>> = {}
  for (const tarifa of historico.filter((item) => item.vigente)) {
    tarifas[tarifa.tiempoComida] = tarifa.monto
  }
  return tarifas
}

export function tarifasPorComidaDesdeMontos(
  tarifas: Partial<Record<TiempoComida, number>>,
): TarifasPorComidaForm {
  const valores = { ...TARIFAS_POR_COMIDA_VACIAS }
  for (const comida of COMIDAS_TABS) {
    const monto = tarifas[comida.id]
    if (monto && monto > 0) {
      valores[comida.id] = String(monto)
    }
  }
  return valores
}

export function parseTarifasPorComida(
  values: TarifasPorComidaForm,
): TarifaComidaPayload[] {
  return COMIDAS_TABS.map((comida) => ({
    tiempoComida: mapearComidaApi(comida.id),
    monto: Number.parseFloat(values[comida.id]) || 0,
  })).filter((item) => item.monto > 0)
}

export function tieneTarifasPorComida(values: TarifasPorComidaForm): boolean {
  return parseTarifasPorComida(values).length > 0
}

export function resolverTarifaVigenteMinima(
  tarifas: Partial<Record<TiempoComida, number>>,
): number {
  const montos = Object.values(tarifas).filter((monto) => monto > 0)
  return montos.length > 0 ? Math.min(...montos) : 0
}

export function formatearResumenTarifas(
  tarifas: Partial<Record<TiempoComida, number>>,
): string {
  const montos = Object.values(tarifas).filter((monto) => monto > 0)
  if (montos.length === 0) return "—"
  const min = Math.min(...montos)
  const max = Math.max(...montos)
  if (min === max) return formatearMonedaTarifa(min)
  return `${formatearMonedaTarifa(min)} – ${formatearMonedaTarifa(max)}`
}

export function labelComidaTarifa(comida: TiempoComida): string {
  return COMIDAS_TABS.find((item) => item.id === comida)?.label ?? comida
}

export function normalizarTiempoComidaTarifa(valor: unknown): TiempoComida {
  return mapearComidaInterna(String(valor ?? "almuerzo"))
}

export interface VigenciaTarifaAgrupada {
  clave: string
  anio: number
  vigenciaDesde: string
  vigenciaHasta: string
  vigente: boolean
  registradoPor: string
  motivoCambio: string
  creadoEn: string
  tarifas: Array<{ comida: TiempoComida; monto: number; id: string }>
}

export function agruparHistoricoPorVigencia(
  tarifas: TarifaHistorico[],
): VigenciaTarifaAgrupada[] {
  const grupos = new Map<string, VigenciaTarifaAgrupada>()

  for (const tarifa of tarifas) {
    const clave = `${tarifa.anio}|${tarifa.vigenciaDesde}|${tarifa.vigenciaHasta}|${tarifa.motivoCambio}`
    const existente = grupos.get(clave)
    if (existente) {
      existente.tarifas.push({
        comida: tarifa.tiempoComida,
        monto: tarifa.monto,
        id: tarifa.id,
      })
      existente.vigente = existente.vigente || tarifa.vigente
      continue
    }

    grupos.set(clave, {
      clave,
      anio: tarifa.anio,
      vigenciaDesde: tarifa.vigenciaDesde,
      vigenciaHasta: tarifa.vigenciaHasta,
      vigente: tarifa.vigente,
      registradoPor: tarifa.registradoPor,
      motivoCambio: tarifa.motivoCambio,
      creadoEn: tarifa.creadoEn,
      tarifas: [
        {
          comida: tarifa.tiempoComida,
          monto: tarifa.monto,
          id: tarifa.id,
        },
      ],
    })
  }

  return [...grupos.values()].sort((a, b) => b.anio - a.anio)
}
