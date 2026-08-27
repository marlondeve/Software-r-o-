import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { mockNutricionista } from "@/modules/dietas-cocina/inicio/datos/mockNutricionista"
import { construirActividadRecienteEnfermeria } from "@/modules/dietas-cocina/lib/construirActividadEnfermeria"
import { estadoDietaDesdeCiclo } from "@/modules/dietas-cocina/lib/mapearEstadoDietaOrden"
import {
  esSalidaClinicaSostenida,
  esSalidaClinicaCancelada,
  esCanceladaManual,
  labelEstadoDietaVisible,
} from "@/modules/dietas-cocina/lib/labelEstadoOperativo"
import { deduplicarFilasPorPacienteComida } from "@/modules/dietas-cocina/lib/fusionarFilasDieta"
import {
  filtrarEtiquetasDelPeriodoOperativo,
  resolverContextoFilaDieta,
} from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import {
  formatearPeriodoOperativo,
  resolverComidaOperativaActual,
  resolverProximoCierre,
} from "@/modules/dietas-cocina/lib/resolverPeriodoOperativoNutricionista"
import { labelComida as labelComidaOperativa } from "@/modules/dietas-cocina/parametros/lib/formatearTurnoOperativo"

const COLORES_ESTADO: Record<string, string> = {
  "Sin solicitud": "#b00020",
  Guardado: "#bbf244",
  Confirmada: "#006671",
  "En gestión": "#0ea5e9",
  Preparando: "#0ea5e9",
  "Lista p/ Despacho": "#00818f",
  Despachada: "#0369a1",
  Recibida: "#00818f",
  Devuelta: "#94a3b8",
  Recogida: "#64748b",
  Cancelada: "#d8e0e8",
  "Salida clínica": "#94a3b8",
  "Salida clínica sostenida": "#f59e0b",
  "Salida clínica · asume la clínica": "#f59e0b",
  "Asume clínica": "#f59e0b",
}

function etiquetaSegmentoEstado(
  estado: EstadoDieta,
  fila: FilaDieta,
): string {
  return labelEstadoDietaVisible(estado, {
    observaciones: fila.observaciones,
    cancelacionPorSalidaClinica: fila.cancelacionPorSalidaClinica,
    salidaClinicaSostenida: fila.salidaClinicaSostenida,
  })
}

export function construirDashboardNutricionistaDesdeCiclo(
  filas: FilaDieta[],
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  fechaReferencia = new Date(),
) {
  const comida = resolverComidaOperativaActual(fechaReferencia)
  const cierreInfo = resolverProximoCierre(fechaReferencia)
  const comidaPendientes = cierreInfo.comida
  const etiquetasPeriodo = filtrarEtiquetasDelPeriodoOperativo(etiquetas, {
    comida,
  })

  let filasComida = filas.filter((f) => f.comida === comida)
  if (filasComida.length === 0 && filas.length > 0) {
    filasComida = filas
  }

  const resolverEstado = (fila: FilaDieta) => {
    const { orden, etiqueta } = resolverContextoFilaDieta(
      fila,
      ordenes,
      etiquetasPeriodo,
    )
    return estadoDietaDesdeCiclo(fila, orden, etiqueta)
  }

  filasComida = deduplicarFilasPorPacienteComida(filasComida, resolverEstado)

  let filasPendientesCierre = filas.filter((f) => f.comida === comidaPendientes)
  if (filasPendientesCierre.length === 0 && !cierreInfo.diaSiguiente && filas.length > 0) {
    filasPendientesCierre = filasComida
  } else {
    filasPendientesCierre = deduplicarFilasPorPacienteComida(
      filasPendientesCierre,
      resolverEstado,
    )
  }

  const filasConEstado = filasComida.map((fila) => ({
    fila,
    estado: resolverEstado(fila),
  }))

  const pacientesActivos = filasConEstado.filter(
    (f) => f.estado !== "cancelada",
  ).length
  const etiquetasPendientes = filtrarEtiquetasDelPeriodoOperativo(etiquetas, {
    comida: comidaPendientes,
  })
  const pendientes = filasPendientesCierre.filter((fila) => {
    const { orden, etiqueta } = resolverContextoFilaDieta(
      fila,
      ordenes,
      etiquetasPendientes,
    )
    const estado = estadoDietaDesdeCiclo(fila, orden, etiqueta)
    return ["no-solicitada", "guardado"].includes(estado)
  }).length
  const confirmadas = filasConEstado.filter((f) =>
    [
      "confirmada",
      "por-iniciar",
      "en-preparacion",
      "lista-despacho",
      "despachada",
    ].includes(f.estado),
  ).length
  const novedades = filasConEstado.filter((f) => f.estado === "guardado").length
  const salidasClinicas = filasConEstado.filter((f) =>
    esSalidaClinicaCancelada({ ...f.fila, estado: f.estado }),
  ).length
  const canceladasManuales = filasConEstado.filter((f) =>
    esCanceladaManual({ ...f.fila, estado: f.estado }),
  ).length
  const salidasSostenidas = filasConEstado.filter((f) =>
    esSalidaClinicaSostenida({ ...f.fila, estado: f.estado }),
  ).length
  const fueraHorario = filasComida.filter((f) => f.cancelacionTardia).length

  const conteoEstados = new Map<string, number>()
  for (const { fila, estado } of filasConEstado) {
    const label = etiquetaSegmentoEstado(estado, fila)
    conteoEstados.set(label, (conteoEstados.get(label) ?? 0) + 1)
  }

  const segmentos = [...conteoEstados.entries()]
    .filter(([, value]) => value > 0)
    .map(([label, value]) => ({
      label,
      value,
      color: COLORES_ESTADO[label] ?? "#94a3b8",
    }))

  const sinSolicitud = filasConEstado.filter(
    (f) => f.estado === "no-solicitada",
  ).length
  const cambiosPendientes = filasConEstado.filter(
    (f) => f.estado === "guardado",
  ).length

  const actividadReciente = construirActividadRecienteEnfermeria(
    filasComida,
    ordenes,
    etiquetas,
    comida,
  )

  const comidaLabel = labelComidaOperativa(comida)

  return {
    periodoOperativo: formatearPeriodoOperativo(fechaReferencia),
    kpis: [
      {
        label: "Pacientes activos",
        value: String(pacientesActivos),
        variant: "default" as const,
      },
      {
        label: "Dietas pendientes",
        value: String(pendientes),
        variant: "default" as const,
      },
      {
        label: "Confirmadas",
        value: String(confirmadas),
        variant: "default" as const,
      },
      {
        label: "Novedades",
        value: String(novedades),
        variant: "default" as const,
      },
      {
        label: "Salidas clínicas",
        value: String(salidasClinicas),
        variant: "alert" as const,
      },
      {
        label: "Canceladas",
        value: String(canceladasManuales),
        variant: "alert" as const,
      },
      {
        label: "Asume clínica",
        value: String(salidasSostenidas),
        variant: salidasSostenidas > 0 ? ("default" as const) : ("muted" as const),
      },
      {
        label: "Fuera de horario",
        value: String(fueraHorario),
        variant: "alert" as const,
      },
    ],
    distribucion: {
      total: filasComida.length || pacientesActivos,
      segmentos:
        segmentos.length > 0
          ? segmentos
          : mockNutricionista.distribucion.segmentos,
    },
    atencion: [
      {
        title: "Pacientes sin dieta solicitada",
        description:
          sinSolicitud > 0
            ? `${sinSolicitud} ingreso(s) sin asignación para ${comidaLabel.toLowerCase()}.`
            : "Sin pacientes pendientes de solicitud.",
      },
      {
        title: "Cambios pendientes",
        description:
          cambiosPendientes > 0
            ? `${cambiosPendientes} solicitud(es) guardadas por validar.`
            : "No hay modificaciones de enfermería pendientes.",
      },
    ],
    actividadReciente:
      actividadReciente.length > 0
        ? actividadReciente
        : mockNutricionista.actividadReciente,
    proximoCierre: {
      ...cierreInfo,
      pendientes,
    },
  }
}
