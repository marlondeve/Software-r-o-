import { mapearComidaInterna, normalizarClave } from "@/modules/dietas-cocina/api/utils"
import { formatearHoraDesdeIsoApi } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import type { EtiquetaDto } from "@/modules/dietas-cocina/types/api-dtos"
import type {
  EstadoEtiqueta,
  EstadoLogisticaEtiqueta,
  MotivoDevolucion,
} from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

function resolverIdIngresoEtiqueta(registro: Record<string, unknown>): number | undefined {
  const raw = normalizarClave(registro, "idIngreso", "IdIngreso")
  if (raw == null || raw === "") return undefined
  const numero = Number(raw)
  return Number.isFinite(numero) && numero > 0 ? numero : undefined
}

function resolverTipoDocumentoEtiqueta(registro: Record<string, unknown>): string | undefined {
  const raw = normalizarClave(registro, "tipoDocumento", "TipoDocumento")
  if (typeof raw !== "string") return undefined
  const tipo = raw.trim()
  return tipo || undefined
}

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

function resolverAisladoEtiqueta(dto: EtiquetaDto): boolean {
  const registro = dto as Record<string, unknown>
  const aisladoRaw = normalizarClave(registro, "aislado", "Aislado")
  if (typeof aisladoRaw === "boolean") return aisladoRaw
  if (typeof aisladoRaw === "string") {
    const valor = aisladoRaw.trim().toLowerCase()
    return valor === "true" || valor === "si" || valor === "sí"
  }

  const aislamientoRaw = normalizarClave(registro, "aislamiento", "Aislamiento")
  if (typeof aislamientoRaw === "boolean") return aislamientoRaw
  if (typeof aislamientoRaw === "string") {
    const valor = aislamientoRaw.trim().toLowerCase()
    return valor !== "" && valor !== "ninguno" && valor !== "no" && valor !== "false"
  }

  return false
}

function resolverObservacionesEtiqueta(dto: EtiquetaDto): string {
  const registro = dto as Record<string, unknown>
  const observaciones = String(
    normalizarClave(registro, "observaciones", "Observaciones") ?? "",
  ).trim()
  if (observaciones) return observaciones

  const partes: string[] = []
  const obsAislamiento = String(
    normalizarClave(registro, "observacionAislamiento", "ObservacionAislamiento") ?? "",
  ).trim()
  if (obsAislamiento) partes.push(obsAislamiento)

  const alergiasRaw = normalizarClave(registro, "alergias", "Alergias")
  const alergico = Boolean(normalizarClave(registro, "alergico", "Alergico"))
  if (alergico && typeof alergiasRaw === "string" && alergiasRaw.trim()) {
    partes.push(`Alergias: ${alergiasRaw.trim()}`)
  }

  return partes.join(" · ")
}

function resolverHoraEtiquetaDesdeDto(
  registro: Record<string, unknown>,
  ...claves: string[]
): string | undefined {
  for (const clave of claves) {
    const raw = normalizarClave(registro, clave, clave)
    if (raw == null || raw === "") continue

    if (typeof raw === "string") {
      if (/^\d{4}-\d{2}-\d{2}/.test(raw) || raw.includes("T")) {
        const formateada = formatearHoraDesdeIsoApi(raw)
        if (formateada !== "—") return formateada
      }
      return raw
    }
  }
  return undefined
}

export function mapEtiquetaDtoToDomain(dto: EtiquetaDto): EtiquetaEnfermera {
  const registro = dto as Record<string, unknown>
  const aislado = resolverAisladoEtiqueta(dto)
  const estadoLogistica = normalizarEstadoLogistica(dto.estadoLogistica ?? dto.estado)
  const alergiasRaw = normalizarClave(registro, "alergias", "Alergias") ?? dto.alergias
  const alergiasLista: string[] | undefined = Array.isArray(alergiasRaw)
    ? alergiasRaw.map(String)
    : typeof alergiasRaw === "string" && alergiasRaw.trim()
      ? alergiasRaw.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
      : undefined

  return {
    id: String(dto.id ?? ""),
    codigo: String(dto.codigo ?? ""),
    pacienteId: String(dto.pacienteId ?? ""),
    idIngreso: resolverIdIngresoEtiqueta(registro),
    tipoDocumento: resolverTipoDocumentoEtiqueta(registro),
    paciente: String(dto.paciente ?? ""),
    documento: String(dto.documento ?? dto.cedula ?? ""),
    edad: Number(normalizarClave(registro, "edad", "Edad") ?? dto.edad ?? 0),
    aislamiento: aislado,
    pabellon: String(dto.pabellon ?? ""),
    habitacion: String(dto.habitacion ?? ""),
    cama: dto.cama,
    tipoDieta: String(dto.tipoDieta ?? ""),
    consistencia: String(dto.consistencia ?? ""),
    observaciones: resolverObservacionesEtiqueta(dto),
    comida: mapearComidaInterna(String(dto.comida ?? "almuerzo")),
    fechaHora: String(
      dto.fechaOperativa ?? dto.fechaHora ?? dto.generadaEn ?? "",
    ),
    estado: resolverEstadoEtiqueta(dto),
    qrPayload: String(dto.qrPayload ?? dto.codigo ?? ""),
    estadoLogistica,
    alergias: alergiasLista,
    horaPreEntrega: resolverHoraEtiquetaDesdeDto(
      registro,
      "horaPreEntrega",
      "preEntregadaEn",
      "PreEntregadaEn",
    ),
    horaEntrega: resolverHoraEtiquetaDesdeDto(
      registro,
      "horaEntrega",
      "entregadaEn",
      "EntregadaEn",
    ),
    horaDevolucion: resolverHoraEtiquetaDesdeDto(
      registro,
      "horaDevolucion",
      "devueltaEn",
      "DevueltaEn",
    ),
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
