import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { mockNutricionista } from "@/modules/dietas-cocina/inicio/datos/mockNutricionista"
import { construirActividadRecienteEnfermeria } from "@/modules/dietas-cocina/lib/construirActividadEnfermeria"
import { estadoDietaDesdeCiclo } from "@/modules/dietas-cocina/lib/mapearEstadoDietaOrden"
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
  "no-solicitada": "#b00020",
  guardado: "#bbf244",
  confirmada: "#006671",
  "por-iniciar": "#64748b",
  "en-preparacion": "#0ea5e9",
  "lista-despacho": "#00818f",
  despachada: "#0369a1",
  recibida: "#00818f",
  devuelta: "#94a3b8",
  recogida: "#64748b",
  cancelada: "#d8e0e8",
}

const LABEL_ESTADO: Record<string, string> = {
  "no-solicitada": "Sin solicitud",
  guardado: "Guardado",
  confirmada: "Confirmada",
  "por-iniciar": "Por iniciar",
  "en-preparacion": "En gestión",
  "lista-despacho": "Lista despacho",
  despachada: "Despachada",
  recibida: "Recibida",
  devuelta: "Devuelta",
  recogida: "Recogida",
  cancelada: "Cancelada",
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

  let filasPendientesCierre = filas.filter((f) => f.comida === comidaPendientes)
  if (filasPendientesCierre.length === 0 && !cierreInfo.diaSiguiente && filas.length > 0) {
    filasPendientesCierre = filasComida
  }

  const filasConEstado = filasComida.map((fila) => {
    const { orden, etiqueta } = resolverContextoFilaDieta(
      fila,
      ordenes,
      etiquetasPeriodo,
    )
    const estado = estadoDietaDesdeCiclo(fila, orden, etiqueta)
    return { fila, estado }
  })

  const pacientesActivos = new Set(filasComida.map((f) => f.pacienteId)).size
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
  const cancelaciones = filasConEstado.filter(
    (f) => f.estado === "cancelada",
  ).length
  const fueraHorario = filasComida.filter((f) => f.cancelacionTardia).length

  const conteoEstados = new Map<string, number>()
  for (const { estado } of filasConEstado) {
    conteoEstados.set(estado, (conteoEstados.get(estado) ?? 0) + 1)
  }

  const segmentos = [...conteoEstados.entries()]
    .filter(([, value]) => value > 0)
    .map(([estado, value]) => ({
      label: LABEL_ESTADO[estado] ?? estado,
      value,
      color: COLORES_ESTADO[estado] ?? "#94a3b8",
    }))

  const sinSolicitud = filasComida.filter((f) => f.estado === "no-solicitada").length
  const cambiosPendientes = filasComida.filter((f) => f.estado === "guardado").length

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
        label: "Cancelaciones",
        value: String(cancelaciones),
        variant: "alert" as const,
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
