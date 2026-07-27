import type { CatalogoDietaDto, TarifaHistoricoDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { DietaCatalogo, TarifaHistorico } from "@/modules/dietas-cocina/types/catalog"
import type { EstadoDietaCatalogo } from "@/modules/dietas-cocina/types/enums"
import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import {
  formatearFechaCatalogo,
  formatearFechaHoraCatalogo,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function parseFechaApi(valor: unknown): Date | null {
  if (!valor) return null
  const fecha = new Date(String(valor))
  return Number.isNaN(fecha.getTime()) ? null : fecha
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
  if (estadoRaw === "vigente" || estadoRaw === "programada" || estadoRaw === "vencida") {
    return estadoRaw
  }
  return activa ? "vigente" : "vencida"
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
  const tarifaActual = Number(
    normalizarClave(registro, "tarifaActual", "TarifaActual") ?? 0,
  )
  const historicoRaw = normalizarClave(registro, "historicoTarifas", "HistoricoTarifas")
  const historicoTarifas = Array.isArray(historicoRaw)
    ? historicoRaw.map((item) => mapTarifaHistoricoDto(item as TarifaHistoricoDto))
    : []
  const tarifaVigenteHistorico = historicoTarifas.find((tarifa) => tarifa.vigente)?.monto
  const fechaFinRaw = normalizarClave(registro, "fechaFin", "FechaFin")

  return {
    id,
    codigo,
    nombre: String(normalizarClave(registro, "nombre", "Nombre") ?? "Sin nombre"),
    descripcion: String(normalizarClave(registro, "descripcion", "Descripcion") ?? ""),
    estado: resolverEstadoCatalogo(registro, activa),
    tarifaVigente: tarifaActual || tarifaVigenteHistorico || 0,
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
