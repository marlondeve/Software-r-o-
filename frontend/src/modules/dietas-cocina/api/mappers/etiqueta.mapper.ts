import { mapearComidaInterna } from "@/modules/dietas-cocina/api/utils"
import type { EtiquetaDto } from "@/modules/dietas-cocina/types/api-dtos"
import type {
  EstadoEtiqueta,
  EstadoLogisticaEtiqueta,
  MotivoDevolucion,
} from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

function normalizarEstadoEtiqueta(valor: unknown): EstadoEtiqueta {
  const v = String(valor ?? "pendiente").toLowerCase()
  if (
    v === "generada" ||
    v === "impresa" ||
    v === "reimpresa" ||
    v === "pendiente"
  ) {
    return v as EstadoEtiqueta
  }
  return "pendiente"
}

function resolverEstadoEtiqueta(dto: EtiquetaDto): EstadoEtiqueta {
  if (dto.estado) {
    const normalizado = normalizarEstadoEtiqueta(dto.estado)
    if (normalizado !== "pendiente" || String(dto.estado).toLowerCase() === "pendiente") {
      return normalizado
    }
  }
  const logistica = String(dto.estadoLogistica ?? "").toLowerCase()
  if (logistica === "reimpresa") return "reimpresa"
  if (dto.impresaEn || logistica === "impresa") return "impresa"
  if (logistica === "generada") return "generada"
  if (dto.impresaEn) return "impresa"
  return "pendiente"
}

function normalizarEstadoLogistica(valor: unknown): EstadoLogisticaEtiqueta {
  const v = String(valor ?? "generada").toLowerCase().replace(/-/g, "_")
  const mapa: Record<string, EstadoLogisticaEtiqueta> = {
    generada: "generada",
    impresa: "impresa",
    pre_entregada: "pre_entregada",
    entregada: "entregada",
    devuelta: "devuelta",
  }
  return mapa[v] ?? "generada"
}

export function mapEtiquetaDtoToDomain(dto: EtiquetaDto): EtiquetaEnfermera {
  const aislado = Boolean(dto.aislado ?? dto.aislamiento)
  const estadoLogistica = normalizarEstadoLogistica(dto.estadoLogistica ?? dto.estado)
  return {
    id: String(dto.id ?? ""),
    codigo: String(dto.codigo ?? ""),
    pacienteId: String(dto.pacienteId ?? ""),
    paciente: String(dto.paciente ?? ""),
    documento: String(dto.documento ?? dto.cedula ?? ""),
    edad: Number(dto.edad ?? 0),
    aislamiento: aislado,
    pabellon: String(dto.pabellon ?? ""),
    habitacion: String(dto.habitacion ?? ""),
    cama: dto.cama,
    tipoDieta: String(dto.tipoDieta ?? ""),
    consistencia: String(dto.consistencia ?? ""),
    observaciones: String(dto.observaciones ?? ""),
    comida: mapearComidaInterna(String(dto.comida ?? "almuerzo")),
    fechaHora: String(dto.fechaHora ?? dto.generadaEn ?? ""),
    estado: resolverEstadoEtiqueta(dto),
    qrPayload: String(dto.qrPayload ?? dto.codigo ?? ""),
    estadoLogistica,
    alergias: dto.alergias,
    horaPreEntrega: dto.horaPreEntrega,
    horaEntrega: dto.horaEntrega,
    horaDevolucion: dto.horaDevolucion,
    recibidoPor: dto.recibidoPor,
    motivoDevolucion: dto.motivoDevolucion as MotivoDevolucion | undefined,
    observacionesDevolucion: dto.observacionesDevolucion,
    fotoDevolucion: dto.fotoDevolucion,
    ordenCocinaId: dto.ordenCocinaId ? String(dto.ordenCocinaId) : undefined,
    filaDietaId: dto.filaDietaId ? String(dto.filaDietaId) : undefined,
  }
}

export function mapEtiquetaList(dtos: EtiquetaDto[] | unknown): EtiquetaEnfermera[] {
  if (!Array.isArray(dtos)) return []
  return deduplicarEtiquetasPorFila(dtos.map(mapEtiquetaDtoToDomain))
}

/** Conserva la etiqueta más reciente por bandeja (fila dieta). */
export function deduplicarEtiquetasPorFila(
  etiquetas: EtiquetaEnfermera[],
): EtiquetaEnfermera[] {
  const porFila = new Map<string, EtiquetaEnfermera>()
  for (const etiqueta of etiquetas) {
    const clave = etiqueta.filaDietaId ?? etiqueta.id
    const prev = porFila.get(clave)
    if (!prev || etiqueta.fechaHora.localeCompare(prev.fechaHora) > 0) {
      porFila.set(clave, etiqueta)
    }
  }
  return Array.from(porFila.values())
}
