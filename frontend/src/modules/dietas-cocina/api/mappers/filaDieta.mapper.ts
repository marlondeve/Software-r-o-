import { mapearComidaInterna, normalizarClave } from "@/modules/dietas-cocina/api/utils"
import { repararTextoUtf8 } from "@/modules/dietas-cocina/api/utils/texto"
import type { FilaDieta, EventoTrazabilidad } from "@/modules/dietas-cocina/types/diets"
import type {
  EventoTrazabilidadDto,
  FilaDietaDto,
  SolicitudDietaRequestDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"

function normalizarEstado(valor: unknown): EstadoDieta {
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
  const tipoDieta =
    (dto.tipoDieta ?? dto.dieta ?? dto.descripcionDieta ?? null) as string | null
  const nombreCatalogo =
    tipoDietaId && nombresCatalogo?.get(String(tipoDietaId))
      ? repararTextoUtf8(nombresCatalogo.get(String(tipoDietaId))!)
      : repararTextoUtf8(tipoDieta)
  const comidaRaw = String(dto.comida ?? "almuerzo")

  return {
    id: String(dto.id ?? ""),
    pacienteId: String(dto.pacienteId ?? dto.id ?? ""),
    idIngreso: dto.idIngreso,
    cedula: dto.cedula,
    tipoDocumento: dto.tipoDocumento,
    paciente: repararTextoUtf8(String(dto.paciente ?? "")),
    edad: Number(dto.edad ?? 0),
    servicio: repararTextoUtf8(String(dto.servicio ?? "")),
    pabellon: repararTextoUtf8(String(dto.pabellon ?? "")),
    habitacion: repararTextoUtf8(String(dto.habitacion ?? "")),
    consistencia: dto.consistencia ?? null,
    tipoDieta: nombreCatalogo,
    aislado: Boolean(dto.aislado),
    aislamiento: String(dto.aislamiento ?? (dto.aislado ? "Contacto" : "Ninguno")),
    alergico: Boolean(dto.alergico),
    alergias: String(dto.alergias ?? ""),
    observacionAislamiento: String(dto.observacionAislamiento ?? ""),
    observaciones: String(dto.observaciones ?? ""),
    descripcionDieta: dto.descripcionDieta,
    solicitadoPor: dto.solicitadoPor,
    solicitadoEn: dto.solicitadoEn,
    cancelacionTardia: dto.cancelacionTardia,
    estado: normalizarEstado(dto.estado),
    comida: mapearComidaInterna(comidaRaw),
    ordenCocinaId: dto.ordenCocinaId ? String(dto.ordenCocinaId) : undefined,
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

export function mapEventoTrazabilidadDto(dto: EventoTrazabilidadDto): EventoTrazabilidad {
  return {
    id: String(dto.id ?? crypto.randomUUID()),
    titulo: String(dto.titulo ?? ""),
    descripcion: String(dto.descripcion ?? ""),
    fecha: String(dto.fecha ?? ""),
    activo: dto.activo,
  }
}

export interface DatosSolicitudDietaInput {
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

  return {
    tipoDietaId,
    consistencia: datos.consistencia,
    descripcionDieta: datos.tipoDieta,
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
): string {
  return `[${motivo}] ${justificacion}`.trim()
}
