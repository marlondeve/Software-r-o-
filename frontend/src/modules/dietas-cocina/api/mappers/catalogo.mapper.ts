import type { CatalogoDietaDto, TarifaHistoricoDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { DietaCatalogo, TarifaHistorico } from "@/modules/dietas-cocina/types/catalog"
import type { EstadoDietaCatalogo, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import {
  formatearFechaCatalogo,
  formatearFechaHoraCatalogo,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"
import { parsearFechaApi } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import {
  normalizarTiempoComidaTarifa,
  resolverTarifaVigenteMinima,
  tarifasVigentesDesdeHistorico,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/tarifasPorComida"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function parseFechaApi(valor: unknown): Date | null {
  if (!valor) return null
  const texto = String(valor).trim()
  if (!texto) return null
  const soloFecha = texto.match(/^(\d{4}-\d{2}-\d{2})/)
  const sufijo = texto.slice(10)
  if (soloFecha && !/[zZ]|[+-]\d{2}:\d{2}/.test(sufijo) && !/\d{2}:\d{2}/.test(sufijo)) {
    const fecha = new Date(`${soloFecha[1]}T12:00:00`)
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }
  const fecha = parsearFechaApi(texto)
  if (Number.isNaN(fecha.getTime())) return null
  if (fecha.getFullYear() < 1900) return null
  return fecha
}

function formatearFechaApi(valor: unknown): string {
  const fecha = parseFechaApi(valor)
  return fecha ? formatearFechaCatalogo(fecha) : "—"
}

function formatearFechaHoraApi(valor: unknown): string {
  const fecha = parseFechaApi(valor)
  return fecha ? formatearFechaHoraCatalogo(fecha) : "—"
}

function resolverEstadoCatalogo(
  dto: Record<string, unknown>,
  activa: boolean,
): EstadoDietaCatalogo {
  const estadoRaw = String(normalizarClave(dto, "estado", "Estado") ?? "").toLowerCase()
  if (
    estadoRaw === "vigente"
    || estadoRaw === "programada"
    || estadoRaw === "vencida"
    || estadoRaw === "inactiva"
  ) {
    return estadoRaw
  }
  return activa ? "vigente" : "inactiva"
}

function mapTarifasVigentesApi(
  registro: Record<string, unknown>,
  historicoTarifas: TarifaHistorico[],
): Partial<Record<TiempoComida, number>> {
  const tarifasRaw = normalizarClave(registro, "tarifasVigentes", "TarifasVigentes")
  const tarifas: Partial<Record<TiempoComida, number>> = {}

  if (tarifasRaw && typeof tarifasRaw === "object") {
    for (const [clave, monto] of Object.entries(tarifasRaw as Record<string, unknown>)) {
      const valor = Number(monto)
      if (valor > 0) {
        tarifas[normalizarTiempoComidaTarifa(clave)] = valor
      }
    }
  }

  if (Object.keys(tarifas).length === 0) {
    return tarifasVigentesDesdeHistorico(historicoTarifas)
  }

  return tarifas
}

function mapTarifaHistoricoDto(dto: TarifaHistoricoDto | Record<string, unknown>): TarifaHistorico {
  const registro = asRecord(dto) ?? {}
  const anio = Number(normalizarClave(registro, "anio", "Anio") ?? 0)
  const vigenciaDesde = normalizarClave(registro, "vigenciaDesde", "VigenciaDesde")
  const vigenciaHasta = normalizarClave(registro, "vigenciaHasta", "VigenciaHasta")
  const creadoEn = normalizarClave(registro, "creadoEn", "CreadoEn")

  return {
    id: String(normalizarClave(registro, "id", "Id") ?? `TRF-${anio}`),
    anio,
    tiempoComida: normalizarTiempoComidaTarifa(
      normalizarClave(registro, "tiempoComida", "TiempoComida") ?? "almuerzo",
    ),
    monto: Number(normalizarClave(registro, "monto", "Monto") ?? 0),
    vigenciaDesde: formatearFechaApi(vigenciaDesde),
    vigenciaHasta: formatearFechaApi(vigenciaHasta),
    registradoPor: String(
      normalizarClave(registro, "registradoPor", "RegistradoPor") ?? "—",
    ),
    motivoCambio: String(
      normalizarClave(registro, "motivoCambio", "MotivoCambio") ?? "",
    ),
    creadoEn: formatearFechaApi(creadoEn),
    vigente: Boolean(normalizarClave(registro, "vigente", "Vigente")),
  }
}

export function mapCatalogoDtoToDieta(
  dto: CatalogoDietaDto,
  index: number,
): DietaCatalogo {
  const registro = asRecord(dto) ?? {}
  const id = String(normalizarClave(registro, "id", "Id") ?? index + 1)
  const codigo = String(
    normalizarClave(registro, "codigo", "Codigo") ?? `D-${String(index + 1).padStart(3, "0")}`,
  )
  const activa = Boolean(normalizarClave(registro, "activa", "Activa") ?? true)
  const historicoRaw = normalizarClave(registro, "historicoTarifas", "HistoricoTarifas")
  const historicoTarifas = Array.isArray(historicoRaw)
    ? historicoRaw.map((item) => mapTarifaHistoricoDto(item as TarifaHistoricoDto))
    : []
  const tarifasVigentes = mapTarifasVigentesApi(registro, historicoTarifas)
  const tarifaActual = Number(
    normalizarClave(registro, "tarifaActual", "TarifaActual") ?? 0,
  )
  const fechaFinRaw = normalizarClave(registro, "fechaFin", "FechaFin")

  return {
    id,
    codigo,
    nombre: String(normalizarClave(registro, "nombre", "Nombre") ?? "Sin nombre"),
    descripcion: String(normalizarClave(registro, "descripcion", "Descripcion") ?? ""),
    estado: resolverEstadoCatalogo(registro, activa),
    tarifasVigentes,
    tarifaVigente:
      tarifaActual ||
      resolverTarifaVigenteMinima(tarifasVigentes) ||
      historicoTarifas.find((tarifa) => tarifa.vigente)?.monto ||
      0,
    fechaInicio: formatearFechaApi(
      normalizarClave(registro, "fechaInicio", "FechaInicio"),
    ),
    fechaFin: fechaFinRaw ? formatearFechaApi(fechaFinRaw) : null,
    ultimaActualizacion: formatearFechaHoraApi(
      normalizarClave(registro, "modificadoEn", "ModificadoEn"),
    ),
    usuario: String(normalizarClave(registro, "usuario", "Usuario") ?? "—"),
    activa,
    historicoTarifas,
  }
}

export function mapCatalogoList(dtos: CatalogoDietaDto[]): DietaCatalogo[] {
  return dtos.map(mapCatalogoDtoToDieta)
}
