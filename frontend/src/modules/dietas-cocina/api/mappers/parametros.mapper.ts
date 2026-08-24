import type {
  CategoriaEdadDto,
  ClasificarEdadResponseDto,
  TiempoComidaParamDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { ModoCargaAnticipada, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { CategoriaEdad, ParametrosTiempoComida } from "@/modules/dietas-cocina/types/parameters"
import { mapearComidaApi, mapearComidaInterna, normalizarClave } from "@/modules/dietas-cocina/api/utils"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import {
  minutosDesdeHora24,
  sumarMinutosHora,
} from "@/modules/dietas-cocina/parametros/lib/horasOperativas"
import { formatearHora24 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizarHoraApi(hora: string): string {
  const match = hora.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return formatearHora24(hora.trim() || "07:00")
  return formatearHora24(`${match[1]}:${match[2]}`)
}

function plantillasTiemposMock(): ParametrosTiempoComida[] {
  return mockParametrosTiempos.comidas.map((comida) => ({
    ...comida,
    hitos: comida.hitos.map((hito) => ({ ...hito })),
    ventanaCambios: { ...comida.ventanaCambios },
  }))
}

function offsetDesdeLlegada(
  plantilla: ParametrosTiempoComida,
  hitoId: string,
): number {
  const llegada = plantilla.hitos.find((hito) => hito.id === "llegada")?.hora ?? "08:00"
  const hito = plantilla.hitos.find((item) => item.id === hitoId)?.hora ?? llegada
  return minutosDesdeHora24(hito) - minutosDesdeHora24(llegada)
}

function mapTiempoComidaApiRegistro(
  dto: Record<string, unknown>,
  plantilla: ParametrosTiempoComida,
): ParametrosTiempoComida {
  const horaPreparacion = normalizarHoraApi(
    String(
      normalizarClave(dto, "horaPreparacion", "HoraPreparacion") ??
        plantilla.hitos.find((hito) => hito.id === "solicitud")?.hora ??
        "07:00",
    ),
  )
  const horaCierre = normalizarHoraApi(
    String(
      normalizarClave(dto, "horaCierre", "HoraCierre") ??
        plantilla.hitos.find((hito) => hito.id === "novedades")?.hora ??
        "07:30",
    ),
  )
  const horaEntrega = normalizarHoraApi(
    String(
      normalizarClave(dto, "horaEntrega", "HoraEntrega") ??
        plantilla.hitos.find((hito) => hito.id === "llegada")?.hora ??
        "08:00",
    ),
  )
  const activo = Boolean(normalizarClave(dto, "activo", "Activo") ?? plantilla.activo)

  const offsetInicio = offsetDesdeLlegada(plantilla, "inicio-dist")
  const offsetFin = offsetDesdeLlegada(plantilla, "fin-dist")

  return {
    ...plantilla,
    activo,
    hitos: plantilla.hitos.map((hito) => {
      switch (hito.id) {
        case "solicitud":
          return { ...hito, hora: horaPreparacion }
        case "novedades":
          return { ...hito, hora: horaCierre }
        case "llegada":
          return { ...hito, hora: horaEntrega }
        case "inicio-dist":
          return { ...hito, hora: sumarMinutosHora(horaEntrega, offsetInicio) }
        case "fin-dist":
          return { ...hito, hora: sumarMinutosHora(horaEntrega, offsetFin) }
        default:
          return hito
      }
    }),
    ventanaCambios: {
      ...plantilla.ventanaCambios,
      inicio: horaPreparacion,
      fin: horaCierre,
    },
  }
}

/** Mapea respuesta API (HoraPreparacion/Cierre/Entrega) al modelo UI con hitos. */
export function mapTiempoComidaDto(dto: TiempoComidaParamDto | Record<string, unknown>): ParametrosTiempoComida {
  const registro = asRecord(dto) ?? {}
  const comida = mapearComidaInterna(
    String(normalizarClave(registro, "comida", "Comida", "id", "Id") ?? "almuerzo"),
  )
  const plantilla =
    plantillasTiemposMock().find((item) => item.id === comida) ??
    plantillasTiemposMock()[0]!
  return mapTiempoComidaApiRegistro(registro, plantilla)
}

export function mapTiemposComidaList(
  dtos: TiempoComidaParamDto[] | unknown,
): ParametrosTiempoComida[] {
  const payload = dtos
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const registro = payload as Record<string, unknown>
    const tiempos = normalizarClave(registro, "tiempos", "Tiempos")
    if (Array.isArray(tiempos)) {
      return mapTiemposComidaArray(tiempos)
    }
  }

  return mapTiemposComidaArray(dtos)
}

function mapTiemposComidaArray(dtos: TiempoComidaParamDto[] | unknown): ParametrosTiempoComida[] {
  const plantillas = plantillasTiemposMock()
  if (!Array.isArray(dtos) || dtos.length === 0) return plantillas

  const mapaApi = new Map<TiempoComida, Record<string, unknown>>()
  for (const raw of dtos) {
    const registro = asRecord(raw)
    if (!registro) continue
    const comida = mapearComidaInterna(
      String(normalizarClave(registro, "comida", "Comida", "id", "Id") ?? ""),
    )
    mapaApi.set(comida, registro)
  }

  return plantillas.map((plantilla) => {
    const api = mapaApi.get(plantilla.id)
    return api ? mapTiempoComidaApiRegistro(api, plantilla) : plantilla
  })
}

export function mapModoCargaApi(
  payload: unknown,
  fallback: ModoCargaAnticipada = "ventana-por-comida",
): ModoCargaAnticipada {
  if (!payload || typeof payload !== "object") return fallback
  const registro = payload as Record<string, unknown>
  const raw = String(normalizarClave(registro, "modoCarga", "ModoCarga") ?? fallback)
  if (raw === "todas-desde-manana") return "todas-desde-manana"
  if (raw === "por-comida" || raw === "ventana-por-comida") return "ventana-por-comida"
  return fallback
}

export function mapTiemposComidaConfig(
  payload: unknown,
): { tiempos: ParametrosTiempoComida[]; modoCarga: ModoCargaAnticipada } {
  return {
    tiempos: mapTiemposComidaList(payload),
    modoCarga: mapModoCargaApi(payload),
  }
}

export function mapCategoriaEdadDto(dto: CategoriaEdadDto | Record<string, unknown>): CategoriaEdad {
  const registro = asRecord(dto) ?? {}
  const activa = normalizarClave(registro, "activa", "Activa", "estado", "Estado")
  return {
    id: String(normalizarClave(registro, "id", "Id") ?? ""),
    nombre: String(normalizarClave(registro, "nombre", "Nombre") ?? ""),
    rangoMin: Number(
      normalizarClave(registro, "rangoMin", "edadMinima", "EdadMinima") ?? 0,
    ),
    rangoMax: Number(
      normalizarClave(registro, "rangoMax", "edadMaxima", "EdadMaxima") ?? 0,
    ),
    unidad: (String(normalizarClave(registro, "unidad", "Unidad") ?? "Años") as CategoriaEdad["unidad"]) || "Años",
    estado:
      activa === "borrador" || activa === false
        ? "borrador"
        : "activo",
  }
}

export function mapCategoriasEdadList(dtos: CategoriaEdadDto[] | unknown): CategoriaEdad[] {
  if (!Array.isArray(dtos)) return []
  return dtos.map(mapCategoriaEdadDto)
}

export function mapTiemposComidaToRequest(
  tiempos: ParametrosTiempoComida[],
  usuario: string,
  modoCarga?: ModoCargaAnticipada,
) {
  return {
    usuario,
    modoCarga,
    tiempos: tiempos.map((tiempo) => ({
      comida: mapearComidaApi(tiempo.id),
      horaPreparacion:
        tiempo.hitos.find((hito) => hito.id === "solicitud")?.hora ?? "07:00",
      horaCierre:
        tiempo.hitos.find((hito) => hito.id === "novedades")?.hora ?? "07:30",
      horaEntrega:
        tiempo.hitos.find((hito) => hito.id === "llegada")?.hora ?? "08:00",
      activo: tiempo.activo,
      minutosAlertaCierre: 30,
      observaciones: null,
    })),
  }
}

export function mapCategoriasEdadToRequest(categorias: CategoriaEdad[], usuario: string) {
  return {
    usuario,
    categorias: categorias.map((categoria, index) => ({
      nombre: categoria.nombre,
      edadMinima: categoria.rangoMin,
      edadMaxima: categoria.rangoMax,
      factorPorcion: 1,
      descripcion: null,
      activa: categoria.estado === "activo",
      orden: index + 1,
    })),
  }
}

export function mapClasificarEdadResponse(
  dto: ClasificarEdadResponseDto | Record<string, unknown> | null | undefined,
) {
  const registro = asRecord(dto) ?? {}
  return {
    categoria: String(
      normalizarClave(registro, "categoria", "Categoria", "nombre", "Nombre") ?? "",
    ),
    edadMinima: Number(normalizarClave(registro, "edadMinima", "EdadMinima") ?? 0),
    edadMaxima: Number(normalizarClave(registro, "edadMaxima", "EdadMaxima") ?? 0),
    factorPorcion: Number(normalizarClave(registro, "factorPorcion", "FactorPorcion") ?? 1),
  }
}

export type { TiempoComida }
