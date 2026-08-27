import { mapearComidaInterna, fechaOperativaDesdeApi, normalizarClave } from "@/modules/dietas-cocina/api/utils"
import { repararTextoUtf8 } from "@/modules/dietas-cocina/api/utils/texto"
import { normalizarConsistenciaParaComida } from "@/modules/dietas-cocina/lib/comidaOperativa"
import { resolverServicioClinico } from "@/modules/dietas-cocina/lib/servicioClinico"
import { esCancelacionSalidaClinica } from "@/modules/dietas-cocina/lib/labelEstadoOperativo"
import {
  formatearFechaTrazabilidad,
  formatearSolicitadoEn,
} from "@/modules/dietas-cocina/dietas/lib/dietasDetalleUi"
import type { FilaDieta, EventoTrazabilidad } from "@/modules/dietas-cocina/types/diets"
import type {
  EventoTrazabilidadDto,
  FilaDietaDto,
  SolicitudDietaRequestDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"

export function normalizarEstadoDietaDesdeApi(valor: unknown): EstadoDieta {
  const estado = String(valor ?? "no-solicitada").toLowerCase()
  const mapa: Record<string, EstadoDieta> = {
    confirmada: "confirmada",
    guardado: "guardado",
    pendiente: "no-solicitada",
    "no-solicitada": "no-solicitada",
    "no solicitada": "no-solicitada",
    solicitada: "guardado",
    preparando: "preparando",
    "en-preparacion": "en-preparacion",
    "en preparacion": "en-preparacion",
    enpreparacion: "en-preparacion",
    "lista-despacho": "lista-despacho",
    listaenvio: "lista-despacho",
    "lista envio": "lista-despacho",
    "por-iniciar": "por-iniciar",
    recibida: "recibida",
    entregada: "recibida",
    consumida: "recibida",
    devuelta: "devuelta",
    recogida: "recogida",
    noconsumida: "devuelta",
    cancelada: "cancelada",
    despachada: "despachada",
    enruta: "despachada",
    "en ruta": "despachada",
  }
  return mapa[estado] ?? "no-solicitada"
}

export function mapFilaDietaDtoToDomain(
  dto: FilaDietaDto,
  nombresCatalogo?: Map<string, string>,
): FilaDieta {
  const tipoDietaId = dto.tipoDietaId ?? (dto as { tipoDietaId?: string }).tipoDietaId
  const tipoDietaRaw =
    (dto.tipoDieta ?? dto.dieta ?? dto.descripcionDieta ?? null) as string | null
  const nombreCatalogo =
    tipoDietaId && nombresCatalogo?.get(String(tipoDietaId))
      ? repararTextoUtf8(nombresCatalogo.get(String(tipoDietaId))!)
      : repararTextoUtf8(tipoDietaRaw)
  const comidaRaw = String(dto.comida ?? "almuerzo")
  const pabellon = repararTextoUtf8(String(dto.pabellon ?? ""))

  return {
    id: String(dto.id ?? ""),
    pacienteId: String(dto.pacienteId ?? dto.id ?? ""),
    idIngreso: dto.idIngreso,
    cedula: dto.cedula,
    tipoDocumento: dto.tipoDocumento,
    paciente: repararTextoUtf8(String(dto.paciente ?? "")),
    edad: Number(dto.edad ?? 0),
    servicio: resolverServicioClinico(
      repararTextoUtf8(String(dto.servicio ?? "")),
      pabellon,
    ),
    pabellon,
    habitacion: repararTextoUtf8(String(dto.habitacion ?? "")),
    consistencia: dto.consistencia ?? null,
    tipoDieta: nombreCatalogo,
    aislado: Boolean(dto.aislado),
    aislamiento: String(dto.aislamiento ?? (dto.aislado ? "Contacto" : "Ninguno")),
    alergico: Boolean(dto.alergico),
    alergias: String(dto.alergias ?? ""),
    observacionAislamiento: String(dto.observacionAislamiento ?? ""),
    observaciones: String(dto.observaciones ?? ""),
    descripcionDieta: dto.descripcionDieta
      ? repararTextoUtf8(String(dto.descripcionDieta))
      : undefined,
    solicitadoPor: dto.solicitadoPor
      ? repararTextoUtf8(String(dto.solicitadoPor))
      : undefined,
    solicitadoEn: formatearSolicitadoEn(
      dto.solicitadoEn != null ? String(dto.solicitadoEn) : undefined,
    ),
    cancelacionTardia: dto.cancelacionTardia,
    cancelacionPorSalidaClinica:
      String(dto.estado ?? "")
        .toLowerCase()
        .includes("cancel") &&
      esCancelacionSalidaClinica(
        dto.observaciones != null ? String(dto.observaciones) : undefined,
        dto.cancelacionPorSalidaClinica,
        dto.salidaClinicaSostenida,
        normalizarEstadoDietaDesdeApi(dto.estado),
      ),
    salidaClinicaSostenida: Boolean(dto.salidaClinicaSostenida),
    estado: normalizarEstadoDietaDesdeApi(dto.estado),
    comida: mapearComidaInterna(comidaRaw),
    ordenCocinaId: dto.ordenCocinaId ? String(dto.ordenCocinaId) : undefined,
    fechaOperativa: fechaOperativaDesdeApi(
      dto.fechaOperativa != null ? String(dto.fechaOperativa) : undefined,
    ),
  }
}

export function mapFilaDietaList(
  dtos: FilaDietaDto[] | unknown,
  nombresCatalogo?: Map<string, string>,
): FilaDieta[] {
  if (!Array.isArray(dtos)) {
    if (dtos && typeof dtos === "object") {
      const filas = normalizarClave(dtos as Record<string, unknown>, "filas", "Filas")
      if (Array.isArray(filas)) {
        return filas.map((item) =>
          mapFilaDietaDtoToDomain(item as FilaDietaDto, nombresCatalogo),
        )
      }
    }
    return []
  }
  return dtos.map((dto) => mapFilaDietaDtoToDomain(dto, nombresCatalogo))
}

export function mapEventoTrazabilidadDto(
  dto: EventoTrazabilidadDto | Record<string, unknown>,
  opciones?: { activo?: boolean },
): EventoTrazabilidad {
  const registro =
    dto && typeof dto === "object" ? (dto as Record<string, unknown>) : {}

  const tipoEvento = String(
    normalizarClave(registro, "tipoEvento", "TipoEvento", "titulo", "Titulo") ??
      "Evento",
  )
  const descripcion = String(
    normalizarClave(registro, "descripcion", "Descripcion") ?? "",
  )
  const usuario = String(
    normalizarClave(registro, "usuario", "Usuario") ?? "",
  )
  const fechaRaw = normalizarClave(
    registro,
    "fechaEvento",
    "FechaEvento",
    "fecha",
    "Fecha",
  )

  const titulo = tituloDesdeTipoEvento(tipoEvento)
  const descripcionLegible = descripcionEventoLegible(tipoEvento, descripcion)
  const detalle =
    descripcionLegible && descripcionLegible !== titulo
      ? descripcionLegible
      : usuario
        ? `Registrado por ${usuario}`
        : ""

  return {
    id: String(normalizarClave(registro, "id", "Id") ?? crypto.randomUUID()),
    titulo,
    descripcion: detalle,
    fecha: formatearFechaTrazabilidad(fechaRaw),
    activo: opciones?.activo ?? Boolean(registro.activo ?? registro.Activo),
  }
}

const TITULOS_TIPO_EVENTO: Record<string, string> = {
  orden_cocina_creada: "Inclusión en orden de cocina",
  orden_completada: "Orden completada",
  orden_despachada: "Orden despachada",
  orden_en_preparacion: "Preparación iniciada",
  solicitud_guardada: "Solicitud guardada",
  solicitud_confirmada: "Solicitud confirmada",
  dieta_cancelada: "Dieta cancelada",
  dieta_cancelada_egreso: "Cancelación por salida clínica",
  dieta_sostenida_salida_clinica: "Salida clínica · asume la clínica",
  dieta_reactivada_reingreso: "Reingreso al censo",
  novedad_registrada: "Novedad registrada",
}

function descripcionEventoLegible(tipoEvento: string, descripcion: string): string {
  const clave = tipoEvento.trim().toLowerCase()
  if (clave === "dieta_cancelada_egreso") {
    return "Paciente con salida clínica dentro del límite de novedades: la dieta se cancela para evitar preparación."
  }
  if (clave === "dieta_sostenida_salida_clinica") {
    return "Paciente con salida clínica: la dieta se mantiene y el proveedor la envía (costo clínica)."
  }
  if (clave === "dieta_reactivada_reingreso") {
    return "Paciente de nuevo en censo; la dieta vuelve al flujo operativo."
  }
  return descripcion
}

function tituloDesdeTipoEvento(tipoEvento: string): string {
  const clave = tipoEvento.trim().toLowerCase()
  if (TITULOS_TIPO_EVENTO[clave]) return TITULOS_TIPO_EVENTO[clave]
  if (clave.includes("orden") && clave.includes("complet")) return "Orden completada"
  if (clave.includes("orden") && clave.includes("cocina")) {
    return "Inclusión en orden de cocina"
  }
  return clave
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase())
}

export interface DatosSolicitudDietaInput {
  comida?: TiempoComida
  tipoDieta: string
  consistencia: string
  observaciones?: string
  pacienteAislado?: boolean
  observacionAislamiento?: string
  alergico?: boolean
  alergias?: string
}

export function mapSolicitudToRequest(
  datos: DatosSolicitudDietaInput,
  tipoDietaId?: string,
): SolicitudDietaRequestDto {
  const aislado = Boolean(datos.pacienteAislado)
  const alergico = Boolean(datos.alergico)
  const consistencia =
    datos.comida != null
      ? normalizarConsistenciaParaComida(datos.comida, datos.consistencia)
      : datos.consistencia.trim() || null

  return {
    tipoDietaId,
    consistencia: consistencia ?? "",
    descripcionDieta: datos.tipoDieta.trim() || undefined,
    observaciones: datos.observaciones,
    aislado,
    aislamiento: aislado ? "Contacto" : "Ninguno",
    observacionAislamiento: aislado ? datos.observacionAislamiento : undefined,
    alergico,
    alergias: alergico ? (datos.alergias ?? "") : "",
    guardar: true,
  }
}

export function mapCancelarToRequest(
  motivo: string,
  justificacion: string,
  aceptaFacturacion?: boolean,
  rolUsuario?: string | null,
): Record<string, unknown> {
  return {
    motivo,
    justificacion,
    aceptaFacturacion: aceptaFacturacion ?? false,
    rolUsuario: rolUsuario ?? undefined,
  }
}

export function mapNovedadToRequest(
  datos: DatosSolicitudDietaInput & { motivo?: string },
  tipoDietaId?: string,
): Record<string, unknown> {
  const solicitud = mapSolicitudToRequest(datos, tipoDietaId)
  const motivo = datos.motivo?.trim() || "Novedad clínica"
  const detalle = datos.observaciones?.trim()

  return {
    tipoNovedad: "novedad_registrada",
    descripcion: motivo,
    motivo,
    observaciones: detalle || undefined,
    tipoDietaId: solicitud.tipoDietaId,
    consistencia: solicitud.consistencia,
    descripcionDieta: solicitud.descripcionDieta,
    aislado: solicitud.aislado,
    aislamiento: solicitud.aislamiento,
    observacionAislamiento: solicitud.observacionAislamiento,
    alergico: solicitud.alergico,
    alergias: solicitud.alergias,
  }
}
