import type { mapDashboardEnfermeraDto } from "@/modules/dietas-cocina/api/mappers/dashboard-view.mapper"
import type { mapDashboardNutricionistaDto } from "@/modules/dietas-cocina/api/mappers/dashboard-view.mapper"
import type { construirDashboardEnfermeraDesdeCiclo } from "@/modules/dietas-cocina/lib/construirDashboardEnfermera"
import type { construirDashboardNutricionistaDesdeCiclo } from "@/modules/dietas-cocina/lib/construirDashboardNutricionista"
import type { reporteViewVacio } from "@/modules/dietas-cocina/api/mappers/reporte-view.mapper"
import { actividadApiPareceEnfermeria } from "@/modules/dietas-cocina/lib/construirActividadEnfermeria"

type DashboardNutricionistaCiclo = ReturnType<
  typeof construirDashboardNutricionistaDesdeCiclo
>
type DashboardNutricionistaApi = ReturnType<typeof mapDashboardNutricionistaDto>
type DashboardEnfermeraCiclo = ReturnType<typeof construirDashboardEnfermeraDesdeCiclo>
type DashboardEnfermeraApi = ReturnType<typeof mapDashboardEnfermeraDto>
type ReporteView = ReturnType<typeof reporteViewVacio>

function kpisTienenValores(
  kpis: Array<{ value: string | number }>,
): boolean {
  return kpis.some((kpi) => Number(kpi.value) > 0)
}

function preferirLista<T>(api: T[], ciclo: T[]): T[] {
  return api.length > 0 ? api : ciclo
}

function resolverActividadRecienteEnfermeria(
  api: DashboardNutricionistaApi["actividadReciente"],
  ciclo: DashboardNutricionistaCiclo["actividadReciente"],
): DashboardNutricionistaCiclo["actividadReciente"] {
  if (actividadApiPareceEnfermeria(api) && api.length > 0) return api
  if (ciclo.length > 0) return ciclo
  return api
}

export function mesclarDashboardNutricionista(
  api: DashboardNutricionistaApi,
  ciclo: DashboardNutricionistaCiclo,
): DashboardNutricionistaCiclo {
  return {
    periodoOperativo: ciclo.periodoOperativo,
    // KPIs y donut salen del censo operativo (una fila por paciente). El API
    // cuenta filas crudas de BD y puede inflar «Total dietas» con duplicados.
    kpis: ciclo.kpis,
    distribucion:
      ciclo.distribucion.segmentos.length > 0
        ? ciclo.distribucion
        : api.distribucion,
    atencion: preferirLista(ciclo.atencion, api.atencion),
    actividadReciente: resolverActividadRecienteEnfermeria(
      api.actividadReciente,
      ciclo.actividadReciente,
    ),
    proximoCierre: {
      ...ciclo.proximoCierre,
      pendientes: ciclo.proximoCierre.pendientes,
    },
  }
}

export function mesclarDashboardEnfermera(
  api: DashboardEnfermeraApi,
  ciclo: DashboardEnfermeraCiclo,
): DashboardEnfermeraCiclo {
  return {
    ...ciclo,
    kpis: ciclo.kpis.length > 0 ? ciclo.kpis : api.kpis,
    dietasRecientes:
      ciclo.dietasRecientes.length > 0
        ? ciclo.dietasRecientes
        : api.dietasRecientes,
    alertas: preferirLista(api.alertas, ciclo.alertas),
  }
}

export function mesclarReporteConCiclo(
  api: ReporteView,
  ciclo: ReporteView,
  opciones?: { modoApi?: boolean },
): ReporteView {
  const modoApi = opciones?.modoApi ?? false

  if (!modoApi) {
    return {
      ...ciclo,
      kpis: kpisTienenValores(api.kpis) ? api.kpis : ciclo.kpis,
      hitos: preferirLista(api.hitos, ciclo.hitos),
      hallazgos: preferirLista(api.hallazgos, ciclo.hallazgos),
      estadoDietas:
        api.estadoDietas.segmentos.length > 0 ? api.estadoDietas : ciclo.estadoDietas,
      tiposDieta: preferirLista(api.tiposDieta, ciclo.tiposDieta),
      motivosDevolucion: preferirLista(api.motivosDevolucion, ciclo.motivosDevolucion),
      motivosRecogida: preferirLista(api.motivosRecogida, ciclo.motivosRecogida),
      distribucionServicio: preferirLista(
        api.distribucionServicio,
        ciclo.distribucionServicio,
      ),
      distribucionTurno: preferirLista(api.distribucionTurno, ciclo.distribucionTurno),
      mostrarDistribucionTurno:
        api.mostrarDistribucionTurno || ciclo.mostrarDistribucionTurno,
      costoPorDia: preferirLista(api.costoPorDia, ciclo.costoPorDia),
      costoPorServicio: preferirLista(api.costoPorServicio, ciclo.costoPorServicio),
      costoPorComida: preferirLista(api.costoPorComida, ciclo.costoPorComida),
      mostrarCostos: api.mostrarCostos || ciclo.mostrarCostos,
    }
  }

  return {
    kpis: kpisTienenValores(api.kpis) ? api.kpis : ciclo.kpis,
    hitos: preferirLista(api.hitos, ciclo.hitos),
    hallazgos: preferirLista(api.hallazgos, ciclo.hallazgos),
    estadoDietas:
      api.estadoDietas.segmentos.length > 0 ? api.estadoDietas : ciclo.estadoDietas,
    tiposDieta: preferirLista(api.tiposDieta, ciclo.tiposDieta),
    motivosDevolucion: preferirLista(api.motivosDevolucion, ciclo.motivosDevolucion),
    motivosRecogida: preferirLista(api.motivosRecogida, ciclo.motivosRecogida),
    distribucionServicio: preferirLista(
      api.distribucionServicio,
      ciclo.distribucionServicio,
    ),
    distribucionTurno: preferirLista(api.distribucionTurno, ciclo.distribucionTurno),
    mostrarDistribucionTurno:
      api.mostrarDistribucionTurno || ciclo.mostrarDistribucionTurno,
    costoPorDia: preferirLista(api.costoPorDia, ciclo.costoPorDia),
    costoPorServicio: preferirLista(api.costoPorServicio, ciclo.costoPorServicio),
    costoPorComida: preferirLista(api.costoPorComida, ciclo.costoPorComida),
    mostrarCostos: api.mostrarCostos || ciclo.mostrarCostos,
  }
}
