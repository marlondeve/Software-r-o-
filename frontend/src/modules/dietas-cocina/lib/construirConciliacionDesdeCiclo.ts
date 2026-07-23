import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type {
  EstadoConciliacion,
  FilaConciliacion,
  RegistroSistema,
} from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { crearDietasCatalogoIniciales } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import {
  formatearTarifaCOP,
  normalizarNombreTipoDieta,
  resolverTarifaPorTipoDieta,
} from "@/modules/dietas-cocina/lib/resolverTarifaDieta"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

const CATALOGO = crearDietasCatalogoIniciales()

function labelComida(comida: TiempoComida): string {
  return COMIDAS_TABS.find((c) => c.id === comida)?.label ?? comida
}

function hashGrupo(key: string): number {
  return key.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

/** Simula cantidades facturadas por el proveedor (demo). */
function calcularCantFact(cantSist: number, grupoKey: string): number {
  if (cantSist === 0) return 0
  const h = hashGrupo(grupoKey)
  if (h % 7 === 3) return 0
  if (h % 5 === 2) return cantSist * 2
  if (h % 11 === 5) return cantSist + Math.max(1, Math.ceil(cantSist * 0.15))
  return cantSist
}

/** Simula tarifa facturada distinta en algunos grupos (demo). */
function tarifaFacturadaDemo(
  tarifaSist: number,
  grupoKey: string,
): { tarifa: number; alerta: boolean } {
  const h = hashGrupo(grupoKey)
  if (h % 13 === 4) {
    return { tarifa: tarifaSist * 1.05, alerta: true }
  }
  return { tarifa: tarifaSist, alerta: false }
}

function resolverEstadoConciliacion(
  cantSist: number,
  cantFact: number,
  difEconomica: number,
  tarifaAlerta: boolean,
): EstadoConciliacion {
  if (cantFact === 0 && cantSist > 0) return "pendiente"
  if (cantSist !== cantFact) return "dif-cantidad"
  if (tarifaAlerta || difEconomica !== 0) return "dif-tarifa"
  return "coincide"
}

function formatearDifEconomica(valor: number): string {
  const fmt = Math.abs(valor).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (valor === 0) return "$0.00"
  return `${valor > 0 ? "+" : "-"}$${fmt}`
}

function construirRegistros(ordenes: OrdenCocina[]): RegistroSistema[] {
  return ordenes.map((orden) => ({
    fecha: new Date().toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    paciente: orden.paciente,
    habitacion: `Hab. ${orden.habitacion}`,
    estado:
      orden.estadoCocina === "despachada"
        ? "Despachada"
        : orden.estadoCocina === "lista"
          ? "Lista"
          : "En cocina",
  }))
}

export function construirConciliacionDesdeCiclo(
  ordenes: OrdenCocina[],
): FilaConciliacion[] {
  const ordenesConciliables = ordenes.filter(
    (o) => o.estadoCocina !== "cancelada" && o.estadoCocina !== "por_iniciar",
  )

  const grupos = new Map<
    string,
    { tipo: string; consistencia: string; comida: TiempoComida; ordenes: OrdenCocina[] }
  >()

  for (const orden of ordenesConciliables) {
    const tipoNorm = normalizarNombreTipoDieta(orden.tipoDieta)
    const key = `${tipoNorm}|${orden.consistencia}|${orden.comida}`
    const existente = grupos.get(key)
    if (existente) {
      existente.ordenes.push(orden)
    } else {
      grupos.set(key, {
        tipo: tipoNorm,
        consistencia: orden.consistencia,
        comida: orden.comida,
        ordenes: [orden],
      })
    }
  }

  return [...grupos.entries()].map(([key, grupo], index) => {
    const cantSist = grupo.ordenes.length
    const cantFact = calcularCantFact(cantSist, key)
    const catalogo = resolverTarifaPorTipoDieta(grupo.tipo, CATALOGO)
    const tarifaSist = catalogo?.tarifaVigente ?? 45_000
    const { tarifa: tarifaFact, alerta: tarifaAlerta } = tarifaFacturadaDemo(
      tarifaSist,
      key,
    )
    const tarifaStr = formatearTarifaCOP(tarifaSist)
    const difCant = cantFact - cantSist
    const difEconomicaNum = cantFact * tarifaFact - cantSist * tarifaSist
    const estado = resolverEstadoConciliacion(
      cantSist,
      cantFact,
      difEconomicaNum,
      tarifaAlerta,
    )

    return {
      id: String(index + 1),
      tipo: `Dieta ${grupo.tipo}`,
      consistencia: grupo.consistencia,
      tiempo: labelComida(grupo.comida),
      tarifa: tarifaStr,
      tarifaAlerta: tarifaAlerta || undefined,
      cantSist,
      cantFact,
      difCant,
      difEconomica: formatearDifEconomica(difEconomicaNum),
      estado,
      registros: construirRegistros(grupo.ordenes),
    }
  })
}

export function construirDetallesConciliacionDesdeFilas(
  filas: FilaConciliacion[],
): Record<string, import("@/modules/dietas-cocina/conciliacion/datos/mockConciliacion").DetalleConciliacion> {
  const detalles: Record<
    string,
    import("@/modules/dietas-cocina/conciliacion/datos/mockConciliacion").DetalleConciliacion
  > = {}

  for (const fila of filas) {
    if (fila.estado === "dif-cantidad" && fila.registros?.length) {
      const tarifaNum =
        Number.parseFloat(fila.tarifa.replace(/[^0-9.-]/g, "")) || 0
      const valorBital = fila.cantSist * tarifaNum
      const valorProveedor = fila.cantFact * tarifaNum
      detalles[fila.id] = {
        titulo: `${fila.consistencia} - ${fila.tiempo}`,
        codigo: `Cód. ${fila.id.padStart(3, "0")}`,
        badge: "Diferencia de cantidad",
        bital: {
          unidades: fila.cantSist,
          valor: `$${valorBital.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
        },
        proveedor: {
          unidades: fila.cantFact,
          valor: `$${valorProveedor.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
        },
        diferencia: `${fila.difCant > 0 ? "+" : ""}${fila.difCant} unidades / ${fila.difEconomica}`,
        totalRegistros: fila.registros.length,
        registros: fila.registros,
      }
    }
  }

  return detalles
}
