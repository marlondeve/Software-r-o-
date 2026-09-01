import type { ReportesKpi } from "@/modules/dietas-cocina/types/reports"

export type TipoReporteKpi = "produccion" | "clinico"

export interface ReporteKpi extends ReportesKpi {
  clave?: string
  destacado?: boolean
  informativo?: boolean
}

export interface ReporteKpiSeccion {
  id: string
  titulo: string
  descripcion?: string
  destacado?: boolean
  kpis: ReporteKpi[]
}

type DefSeccion = {
  id: string
  titulo: string
  descripcion?: string
  destacado?: boolean
  claves: string[]
  informativo?: boolean
}

const OCULTAR_DUPLICADOS = new Set(["costo_dietas_producidas"])

const SECCIONES_PRODUCCION: DefSeccion[] = [
  {
    id: "cocina",
    titulo: "Conciliar con cocina",
    descripcion:
      "Cuadre la planilla del proveedor con estos números (bandejas suministradas y valor FCR).",
    destacado: true,
    claves: ["dietas_producidas_periodo", "costo_total_facturado", "dietas_sin_etiqueta"],
  },
  {
    id: "logistica",
    titulo: "Etiquetas y entrega en piso",
    descripcion: "Seguimiento logístico. No equivale a lo que cocina facturó.",
    claves: [
      "etiquetas_periodo",
      "etiquetas_entregadas_periodo",
      "porcentaje_cumplimiento",
    ],
  },
  {
    id: "operacion",
    titulo: "Operación de cocina",
    claves: ["ordenes_periodo", "ordenes_completadas_periodo", "salidas_asume_clinica"],
  },
  {
    id: "referencia",
    titulo: "Solo referencia — no sumar al total",
    descripcion: "Estos montos ya están contemplados en «Dietas producidas» o usan otra regla.",
    informativo: true,
    claves: ["costo_produccion", "costo_retrasos"],
  },
]

const SECCIONES_CLINICO: DefSeccion[] = [
  {
    id: "cocina",
    titulo: "Conciliar con cocina",
    descripcion:
      "Misma regla que producción: bandejas suministradas según contrato FCR.",
    destacado: true,
    claves: ["dietas_producidas_periodo", "costo_total_facturado", "dietas_sin_etiqueta"],
  },
  {
    id: "censo",
    titulo: "Censo clínico",
    descripcion: "Pacientes y solicitudes en el período. No es lo que cocina despachó.",
    claves: [
      "total_dietas_periodo",
      "dietas_activas_periodo",
      "promedio_diario",
      "ordenes_periodo",
    ],
  },
  {
    id: "eventos",
    titulo: "Eventos clínicos",
    claves: ["salidas_clinicas", "salidas_asume_clinica", "canceladas"],
  },
  {
    id: "referencia",
    titulo: "Solo referencia — no sumar al total",
    descripcion: "Montos informativos; el valor a conciliar es «Costo total facturado».",
    informativo: true,
    claves: ["costo_total", "costo_canc_tardia"],
  },
]

function indicePorClave(kpis: ReporteKpi[]): Map<string, ReporteKpi> {
  const map = new Map<string, ReporteKpi>()
  for (const kpi of kpis) {
    if (!kpi.clave || OCULTAR_DUPLICADOS.has(kpi.clave)) continue
    map.set(kpi.clave, kpi)
  }
  return map
}

export function agruparKpisReporte(
  kpis: ReporteKpi[],
  tipo: TipoReporteKpi,
): ReporteKpiSeccion[] {
  const defs = tipo === "produccion" ? SECCIONES_PRODUCCION : SECCIONES_CLINICO
  const porClave = indicePorClave(kpis)
  const usadas = new Set<string>()

  const secciones: ReporteKpiSeccion[] = []

  for (const def of defs) {
    const items: ReporteKpi[] = []
    for (const clave of def.claves) {
      const kpi = porClave.get(clave)
      if (!kpi) continue
      usadas.add(clave)
      items.push({
        ...kpi,
        destacado: def.destacado && clave === "dietas_producidas_periodo",
        informativo: def.informativo,
      })
    }
    if (items.length > 0) {
      secciones.push({
        id: def.id,
        titulo: def.titulo,
        descripcion: def.descripcion,
        destacado: def.destacado,
        kpis: items,
      })
    }
  }

  const restantes = kpis.filter(
    (k) => k.clave && !usadas.has(k.clave) && !OCULTAR_DUPLICADOS.has(k.clave),
  )
  if (restantes.length > 0) {
    secciones.push({
      id: "otros",
      titulo: "Otros indicadores",
      kpis: restantes,
    })
  }

  return secciones
}

export function kpisTienenClavesApi(kpis: ReporteKpi[]): boolean {
  return kpis.some((k) => Boolean(k.clave?.trim()))
}
