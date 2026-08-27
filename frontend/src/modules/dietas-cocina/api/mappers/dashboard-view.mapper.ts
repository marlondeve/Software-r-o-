import type { DashboardDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import {
  formatearHora12,
  formatearHoraDesdeIsoApi,
  normalizarHoraEnTexto,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { formatearPeriodoOperativo } from "@/modules/dietas-cocina/lib/resolverPeriodoOperativoNutricionista"
import {
  etiquetaAccionDesdeTipoEvento,
} from "@/modules/dietas-cocina/lib/construirActividadEnfermeria"
import { esCancelacionSalidaClinica, TEXTO_SALIDA_CLINICA_ASUME } from "@/modules/dietas-cocina/lib/labelEstadoOperativo"
import { normalizarEstadoDietaDesdeApi } from "@/modules/dietas-cocina/api/mappers/filaDieta.mapper"

// Con salida clínica y cancelada separadas el donut puede pasar de 6 segmentos.
const SEGMENT_COLORS = [
  "#006671",
  "#00818f",
  "#bbf244",
  "#7c6ba8",
  "#0369a1",
  "#f59e0b",
  "#64748b",
  "#94a3b8",
  "#d8e0e8",
]

function leerCampo(item: Record<string, unknown>, ...claves: string[]): unknown {
  return normalizarClave(item, ...claves)
}

function mapKpisApi(kpis: unknown) {
  if (!Array.isArray(kpis)) return []
  return kpis.map((item) => {
    const kpi = item as Record<string, unknown>
    return {
      label: String(leerCampo(kpi, "label", "etiqueta", "Etiqueta") ?? ""),
      value: String(leerCampo(kpi, "value", "valor", "Valor") ?? 0),
      variant: (leerCampo(kpi, "variant") === "alert" ||
      leerCampo(kpi, "variant") === "destructive"
        ? "alert"
        : "default") as "default" | "alert",
    }
  })
}

export function mapKpisDashboardApi(kpis: unknown) {
  return mapKpisApi(kpis).map((kpi, index) => ({
    id: `kpi-${index}`,
    label: kpi.label,
    value: Number(kpi.value),
    variant: kpi.variant,
  }))
}

export function mapAlertasDashboardApi(alertas: unknown) {
  if (!Array.isArray(alertas)) return []
  return alertas.map((item) => {
    const alerta = item as Record<string, unknown>
    const mensaje = String(
      leerCampo(alerta, "mensaje", "Mensaje", "titulo", "Titulo", "descripcion") ?? "",
    )
    const accion = String(leerCampo(alerta, "accion", "Accion", "tipo", "Tipo") ?? "")
    return {
      titulo: mensaje || "Alerta operativa",
      descripcion: accion,
    }
  })
}

function mapDistribucionApi(dto: Record<string, unknown>) {
  const distribuciones = leerCampo(dto, "distribuciones", "distribucion", "Distribuciones")
  if (Array.isArray(distribuciones)) {
    const bloqueEstados =
      distribuciones.find((item) => {
        const tipo = String(leerCampo(item as Record<string, unknown>, "tipo", "Tipo") ?? "")
        return tipo.toLowerCase() === "estados"
      })
    const bloqueDietas =
      bloqueEstados ??
      distribuciones.find((item) => {
        const tipo = String(leerCampo(item as Record<string, unknown>, "tipo", "Tipo") ?? "")
        return tipo.toLowerCase() === "dietas"
      }) ??
      distribuciones[0]
    const items = leerCampo(
      bloqueDietas as Record<string, unknown>,
      "items",
      "Items",
    )
    if (Array.isArray(items)) {
      const segmentos = items.map((item, index) => {
        const row = item as Record<string, unknown>
        return {
          label: String(
            leerCampo(row, "label", "categoria", "Categoria") ?? "",
          ),
          value: Number(leerCampo(row, "value", "cantidad", "Cantidad") ?? 0),
          color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        }
      })
      const total = segmentos.reduce((sum, item) => sum + item.value, 0)
      return { total, segmentos }
    }
  }

  const plano = distribuciones ?? leerCampo(dto, "distribucion")
  if (Array.isArray(plano)) {
    const segmentos = plano.map((item, index) => {
      const row = item as Record<string, unknown>
      return {
        label: String(leerCampo(row, "label", "categoria", "Categoria") ?? ""),
        value: Number(leerCampo(row, "value", "cantidad", "Cantidad") ?? 0),
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      }
    })
    const total = segmentos.reduce((sum, item) => sum + item.value, 0)
    return { total, segmentos }
  }

  return { total: 0, segmentos: [] as Array<{ label: string; value: number; color: string }> }
}

function mapActividadApi(dto: Record<string, unknown>) {
  const actividad =
    leerCampo(dto, "actividadReciente", "actividad", "ActividadReciente") ?? []
  if (!Array.isArray(actividad)) return []
  return actividad.map((item) => {
    const row = item as Record<string, unknown>
    const timestamp = leerCampo(row, "timestamp", "Timestamp", "fecha", "Fecha")
    const horaCampo = String(leerCampo(row, "hora", "Hora") ?? "")
    const hora =
      typeof timestamp === "string" && timestamp
        ? formatearHoraDesdeIsoApi(timestamp)
        : horaCampo
          ? formatearHora12(normalizarHoraEnTexto(horaCampo))
          : "—"

    const habitacion = String(leerCampo(row, "habitacion", "Habitacion") ?? "").trim()
    const pacienteNombre = String(leerCampo(row, "paciente", "Paciente") ?? "").trim()
    const paciente =
      habitacion && pacienteNombre
        ? `${habitacion} / ${pacienteNombre}`
        : pacienteNombre ||
          String(leerCampo(row, "pacienteContexto", "PacienteContexto") ?? "")

    const descripcion = String(
      leerCampo(row, "descripcion", "Descripcion", "accion", "Accion") ?? "",
    )
    const tipo = String(leerCampo(row, "tipo", "Tipo") ?? "")
    const salidaSostenidaFlag = leerCampo(
      row,
      "salidaClinicaSostenida",
      "SalidaClinicaSostenida",
    )
    const salidaClinicaSostenida =
      salidaSostenidaFlag === true ||
      String(salidaSostenidaFlag).toLowerCase() === "true" ||
      tipo.trim().toLowerCase() === "dieta_sostenida_salida_clinica"

    const accion = salidaClinicaSostenida
      ? TEXTO_SALIDA_CLINICA_ASUME
      : etiquetaAccionDesdeTipoEvento(tipo, descripcion)

    const estadoRaw = leerCampo(row, "estado", "Estado")
    const estado = normalizarEstadoDietaDesdeApi(
      estadoRaw ?? inferirEstadoDesdeTipoEvento(tipo),
    )
    const observacionesRaw = leerCampo(
      row,
      "observaciones",
      "Observaciones",
      "descripcion",
      "Descripcion",
    )
    const observaciones =
      observacionesRaw != null ? String(observacionesRaw) : undefined
    const cancelacionFlag = leerCampo(
      row,
      "cancelacionPorSalidaClinica",
      "CancelacionPorSalidaClinica",
    )
    const cancelacionPorSalidaClinica =
      cancelacionFlag === true ||
      String(cancelacionFlag).toLowerCase() === "true" ||
      tipo.trim().toLowerCase() === "dieta_cancelada_egreso" ||
      (estado === "cancelada" && esCancelacionSalidaClinica(observaciones))

    return {
      paciente: paciente || "—",
      accion,
      hora,
      estado,
      observaciones,
      cancelacionPorSalidaClinica,
      salidaClinicaSostenida,
    }
  })
}

function inferirEstadoDesdeTipoEvento(tipo: string): EstadoDieta {
  switch (tipo.toLowerCase()) {
    case "entrega_confirmada":
      return "recibida"
    case "devolucion_registrada":
      return "devuelta"
    case "pre_entrega_confirmada":
      return "confirmada"
    case "dieta_confirmada":
      return "confirmada"
    case "cancelacion":
    case "dieta_cancelada":
    case "dieta_cancelada_egreso":
      return "cancelada"
    case "dieta_sostenida_salida_clinica":
      return "confirmada"
    case "dieta_reactivada_reingreso":
      return "confirmada"
    default:
      return "guardado"
  }
}

function mapAlertasApi(dto: Record<string, unknown>) {
  const alertas = leerCampo(dto, "alertas", "Alertas") ?? []
  if (!Array.isArray(alertas)) return []
  return alertas.map((item) => {
    const row = item as Record<string, unknown>
    return {
      title: String(
        leerCampo(row, "titulo", "Titulo", "tipo", "Tipo", "mensaje", "Mensaje") ?? "",
      ),
      description: String(
        leerCampo(row, "descripcion", "Descripcion", "accion", "Accion", "mensaje", "Mensaje") ?? "",
      ),
    }
  })
}

export function dashboardNutricionistaVacio() {
  return {
    periodoOperativo: "—",
    kpis: [] as Array<{ label: string; value: string; variant: "default" | "alert" }>,
    distribucion: { total: 0, segmentos: [] as Array<{ label: string; value: number; color: string }> },
    atencion: [] as Array<{ title: string; description: string }>,
    actividadReciente: [] as Array<{
      paciente: string
      accion: string
      hora: string
      estado: EstadoDieta
      observaciones?: string | null
      cancelacionPorSalidaClinica?: boolean
    }>,
    proximoCierre: {
      servicio: "—",
      hora: "—",
      tiempoRestante: "—",
      pendientes: 0,
    },
  }
}

export function mapDashboardNutricionistaDto(dto: DashboardDto) {
  const payload = dto as DashboardDto & Record<string, unknown>
  const distribucion = mapDistribucionApi(payload)

  return {
    periodoOperativo: formatearPeriodoOperativo(),
    kpis: mapKpisApi(payload.kpis),
    distribucion,
    atencion: mapAlertasApi(payload),
    actividadReciente: mapActividadApi(payload),
    proximoCierre: {
      servicio: String(
        leerCampo(payload, "proximoCierre", "ProximoCierre") ??
          leerCampo((payload.progreso?.[0] as Record<string, unknown> | undefined) ?? {}, "label", "Label") ??
          "Próximo cierre",
      ),
      hora: "—",
      tiempoRestante: "—",
      pendientes: Number(
        leerCampo((payload.progreso?.[0] as Record<string, unknown> | undefined) ?? {}, "value", "Value") ?? 0,
      ),
    },
  }
}

export function mapDashboardProveedorAlertas(dto: DashboardDto | null) {
  return mapAlertasDashboardApi(dto?.alertas).map((alerta) => ({
    title: alerta.titulo,
    description: alerta.descripcion,
  }))
}

export function dashboardEnfermeraVacio() {
  return {
    piso: "Enfermería",
    servicioEnCurso: "—",
    kpis: [
      { label: "Solicitudes pendientes", value: 0 },
      { label: "Dietas confirmadas", value: 0 },
      { label: "Novedades de hoy", value: 0, alert: false },
    ],
    dietasRecientes: [] as Array<{
      habitacion: string
      paciente: string
      tipo: string
      estado: EstadoDieta
      observaciones?: string | null
      cancelacionPorSalidaClinica?: boolean
    }>,
    alertas: [] as Array<{ habitacion: string; titulo: string; descripcion: string }>,
    contactoNutricion: {
      descripcion: "Central de nutrición clínica.",
      extension: "—",
    },
  }
}

export function mapDashboardEnfermeraDto(dto: DashboardDto) {
  const vacio = dashboardEnfermeraVacio()
  const payload = dto as DashboardDto & Record<string, unknown>
  const kpisMapeados = mapKpisDashboardApi(payload.kpis).map((kpi, index) => ({
    label: kpi.label,
    value: kpi.value,
    alert: kpi.variant === "alert" || index === 2,
  }))
  const kpis = kpisMapeados.length > 0 ? kpisMapeados : vacio.kpis

  const dietasRecientes = mapActividadApi(payload).map((item) => {
    const paciente = String(item.paciente ?? "")
    const [habitacion, nombre] = paciente.includes("/")
      ? paciente.split("/").map((part) => part.trim())
      : ["—", paciente]
    return {
      habitacion: habitacion || "—",
      paciente: nombre || paciente,
      tipo: String(item.accion ?? "—"),
      estado: (item.estado ?? "guardado") as EstadoDieta,
      observaciones: item.observaciones,
      cancelacionPorSalidaClinica: item.cancelacionPorSalidaClinica,
    }
  })

  const alertas = mapAlertasDashboardApi(payload.alertas).map((alerta) => ({
    habitacion: "—",
    titulo: alerta.titulo,
    descripcion: alerta.descripcion,
  }))

  return {
    ...vacio,
    servicioEnCurso: formatearPeriodoOperativo(),
    kpis,
    dietasRecientes,
    alertas,
  }
}
