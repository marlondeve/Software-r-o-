import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { COMIDAS_TABS, type FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { mockNutricionista } from "@/modules/dietas-cocina/inicio/datos/mockNutricionista"
import { estadoDietaDesdeCiclo } from "@/modules/dietas-cocina/lib/mapearEstadoDietaOrden"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

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
  cancelada: "#d8e0e8",
}

const LABEL_ESTADO: Record<string, string> = {
  "no-solicitada": "No solicitada",
  guardado: "Borrador",
  confirmada: "Confirmada",
  "por-iniciar": "Por iniciar",
  "en-preparacion": "En preparación",
  "lista-despacho": "Lista despacho",
  despachada: "Despachada",
  recibida: "Recibida",
  devuelta: "Devuelta",
  cancelada: "Cancelada",
}

function labelComida(comida: TiempoComida): string {
  return COMIDAS_TABS.find((c) => c.id === comida)?.label ?? comida
}

function extraerHora(solicitadoEn?: string): string {
  if (!solicitadoEn) return "—"
  const match = solicitadoEn.match(/(\d{1,2}:\d{2})/)
  return match?.[1] ?? solicitadoEn
}

function accionDesdeEstado(estado: EstadoDieta): string {
  switch (estado) {
    case "no-solicitada":
      return "Sin solicitud"
    case "guardado":
      return "Solicitud nueva"
    case "confirmada":
      return "Confirmación"
    case "cancelada":
      return "Cancelación"
    case "recibida":
      return "Entrega confirmada"
    case "devuelta":
      return "Devolución"
    default:
      return "Actualización"
  }
}

export function construirDashboardNutricionistaDesdeCiclo(
  filas: FilaDieta[],
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  comida: TiempoComida = "almuerzo",
) {
  const ordenPorId = new Map(ordenes.map((o) => [o.id, o]))
  const etiquetaPorOrden = new Map<string, EtiquetaEnfermera>()
  for (const orden of ordenes) {
    if (!orden.etiquetaId) continue
    const etiqueta = etiquetas.find((e) => e.id === orden.etiquetaId)
    if (etiqueta) etiquetaPorOrden.set(orden.id, etiqueta)
  }

  const filasComida = filas.filter((f) => f.comida === comida)

  const filasConEstado = filasComida.map((fila) => {
    const orden = fila.ordenCocinaId
      ? ordenPorId.get(fila.ordenCocinaId)
      : undefined
    const etiqueta = fila.ordenCocinaId
      ? etiquetaPorOrden.get(fila.ordenCocinaId)
      : undefined
    const estado = estadoDietaDesdeCiclo(fila.estado, orden, etiqueta)
    return { fila, estado }
  })

  const pacientesActivos = new Set(filasComida.map((f) => f.pacienteId)).size
  const pendientes = filasConEstado.filter((f) =>
    ["no-solicitada", "guardado"].includes(f.estado),
  ).length
  const confirmadas = filasConEstado.filter((f) =>
    [
      "confirmada",
      "por-iniciar",
      "en-preparacion",
      "lista-despacho",
      "despachada",
    ].includes(f.estado),
  ).length
  const novedades = filasComida.filter((f) => f.estado === "guardado").length
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

  const actividadReciente = filasComida
    .filter((f) => f.solicitadoEn)
    .sort((a, b) => (b.solicitadoEn ?? "").localeCompare(a.solicitadoEn ?? ""))
    .slice(0, 5)
    .map((fila) => {
      const orden = fila.ordenCocinaId
        ? ordenPorId.get(fila.ordenCocinaId)
        : undefined
      const etiqueta = fila.ordenCocinaId
        ? etiquetaPorOrden.get(fila.ordenCocinaId)
        : undefined
      const estado = estadoDietaDesdeCiclo(fila.estado, orden, etiqueta)
      return {
        paciente: `${fila.habitacion} / ${fila.paciente}`,
        accion: accionDesdeEstado(estado),
        hora: extraerHora(fila.solicitadoEn),
        estado,
      }
    })

  const comidaLabel = labelComida(comida)

  return {
    periodoOperativo: `${comidaLabel} - ${mockNutricionista.periodoOperativo.split(" - ")[1] ?? "11:30 AM"}`,
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
            ? `${cambiosPendientes} solicitud(es) en borrador por validar.`
            : "No hay modificaciones de enfermería pendientes.",
      },
    ],
    actividadReciente:
      actividadReciente.length > 0
        ? actividadReciente
        : mockNutricionista.actividadReciente,
    proximoCierre: {
      ...mockNutricionista.proximoCierre,
      pendientes: pendientes || mockNutricionista.proximoCierre.pendientes,
    },
  }
}
