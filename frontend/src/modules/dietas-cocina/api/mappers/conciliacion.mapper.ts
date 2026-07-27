import type {
  ConciliacionKpisDto,
  DetalleConciliacionDto,
  FilaConciliacionDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { EstadoConciliacion } from "@/modules/dietas-cocina/types/enums"
import type { DetalleConciliacion, FilaConciliacion, RegistroSistema } from "@/modules/dietas-cocina/types/reconciliation"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"

function leerNumero(...valores: unknown[]): number {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && valor !== "") {
      const n = Number(valor)
      if (!Number.isNaN(n)) return n
    }
  }
  return 0
}

function leerTexto(...valores: unknown[]): string {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return String(valor)
    }
  }
  return ""
}

function normalizarEstado(valor: unknown, difCant: number): EstadoConciliacion {
  const v = String(valor ?? "pendiente").toLowerCase()
  const mapa: Record<string, EstadoConciliacion> = {
    coincide: "coincide",
    "dif-cantidad": "dif-cantidad",
    "dif-tarifa": "dif-tarifa",
    pendiente: "pendiente",
    "conciliado-manual": "conciliado-manual",
    conciliado: "conciliado-manual",
    en_revision: "pendiente",
  }
  if (mapa[v]) return mapa[v]!
  if (difCant !== 0) return "dif-cantidad"
  return "coincide"
}

function formatDifEconomica(difCant: number, valorUnitario: number, valor?: unknown): string {
  if (typeof valor === "string" && valor.trim()) return valor
  const monto = difCant * valorUnitario
  return formatearMonedaCOP(monto, true)
}

export function mapConciliacionDtoToDomain(dto: FilaConciliacionDto): FilaConciliacion {
  const cantSist = leerNumero(
    dto.cantSist,
    dto.cantidadSolicitada,
    dto.cantidadEntregada,
  )
  const cantFact = leerNumero(dto.cantFact, dto.cantidadFacturada)
  const difCant = leerNumero(dto.difCant, dto.diferencia, cantFact - cantSist)
  const valorUnitario = leerNumero(dto.valorUnitario)
  const tarifa =
    leerTexto(dto.tarifa) ||
    (valorUnitario > 0 ? formatearMonedaCOP(valorUnitario) : "")

  return {
    id: String(dto.id ?? ""),
    tipo: leerTexto(dto.tipo, dto.tipoDieta),
    consistencia: leerTexto(dto.consistencia),
    tiempo: leerTexto(dto.tiempo, dto.comida),
    tarifa,
    tarifaAlerta: dto.tarifaAlerta,
    cantSist,
    cantFact,
    difCant,
    difEconomica: formatDifEconomica(difCant, valorUnitario, dto.difEconomica),
    estado: normalizarEstado(dto.estado, difCant),
  }
}

export function mapKpisConciliacionApi(kpis: ConciliacionKpisDto[] | unknown) {
  if (!Array.isArray(kpis)) return []

  return kpis.map((kpi) => {
    const formato = String(kpi.formato ?? "numero").toLowerCase()
    const valor = leerNumero(kpi.valor, kpi.value)
    let value = String(valor)

    if (formato === "moneda") {
      value = formatearMonedaCOP(valor, true).replace(/^\+\$/, "$")
    } else if (formato === "porcentaje") {
      value = `${valor.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%`
    } else {
      value = valor.toLocaleString("es-CO")
    }

    const clave = String(kpi.clave ?? "").toLowerCase()
    const variant =
      clave === "en_revision" || clave === "valor_diferencias" || clave === "total_diferencias"
        ? ("warning" as const)
        : clave === "pendientes" && valor > 0
          ? ("destructive" as const)
          : ("default" as const)

    return {
      label: leerTexto(kpi.etiqueta, kpi.label),
      value,
      variant,
    }
  })
}

export function mapConciliacionList(dtos: FilaConciliacionDto[] | unknown): FilaConciliacion[] {
  if (!Array.isArray(dtos)) return []
  return dtos.map(mapConciliacionDtoToDomain)
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function badgePorEstado(estado: string): string {
  const mapa: Record<string, string> = {
    coincide: "Sin diferencias",
    "dif-cantidad": "Diferencia de cantidad",
    "dif-tarifa": "Diferencia de tarifa",
    pendiente: "Revisión pendiente",
    "conciliado-manual": "Conciliado manualmente",
    conciliado: "Conciliado manualmente",
    en_revision: "Revisión pendiente",
  }
  return mapa[estado.toLowerCase()] ?? estado
}

export function mapDetalleConciliacionDto(dto: DetalleConciliacionDto): DetalleConciliacion {
  const linea = dto.linea ?? dto.Linea ?? {}
  const eventos = dto.eventosDieta ?? dto.EventosDieta ?? []

  const cantSist = Number(
    linea.cantSist ?? linea.cantidadSolicitada ?? linea.cantidadEntregada ?? 0,
  )
  const cantFact = Number(linea.cantFact ?? linea.cantidadFacturada ?? 0)
  const valorUnit = Number(linea.valorUnitario ?? 0)
  const tarifaNum =
    valorUnit > 0
      ? valorUnit
      : Number.parseFloat(String(linea.tarifa ?? "").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0

  const valorBital = cantSist * tarifaNum
  const valorProveedor = cantFact * tarifaNum
  const difCant = Number(linea.difCant ?? linea.diferencia ?? cantFact - cantSist)

  let diferencia = "Sin diferencia registrada"
  if (difCant !== 0 || linea.difEconomica) {
    const partes: string[] = []
    if (difCant !== 0) {
      partes.push(`${difCant > 0 ? "+" : ""}${difCant} unidades`)
    }
    if (linea.difEconomica && linea.difEconomica !== "$0.00") {
      partes.push(String(linea.difEconomica))
    } else if (valorBital !== valorProveedor) {
      partes.push(formatMoney(valorProveedor - valorBital))
    }
    diferencia = partes.join(" / ")
  }

  const registros: RegistroSistema[] = eventos.map((evento) => ({
    fecha: String(evento.fecha ?? ""),
    paciente: String(evento.titulo ?? ""),
    habitacion: String(evento.descripcion ?? ""),
    estado: evento.activo ? "Actual" : "Registrado",
  }))

  if (registros.length === 0 && linea.paciente) {
    registros.push({
      fecha: String(linea.fechaOperativa ?? "—"),
      paciente: String(linea.paciente),
      habitacion: linea.habitacion ? `Hab. ${linea.habitacion}` : "—",
      estado: String(linea.estado ?? "Confirmada"),
    })
  }

  const consistencia = String(linea.consistencia ?? linea.tipo ?? linea.tipoDieta ?? "")
  const tiempo = String(linea.tiempo ?? linea.comida ?? "")
  const estado = String(linea.estado ?? "pendiente")

  return {
    titulo: `${consistencia} - ${tiempo}`.trim(),
    codigo: `Cód. ${String(linea.id ?? "").slice(0, 8) || "—"}`,
    badge: badgePorEstado(estado),
    bital: {
      unidades: cantSist,
      valor: formatMoney(valorBital),
    },
    proveedor: {
      unidades: cantFact,
      valor: formatMoney(valorProveedor),
    },
    diferencia,
    totalRegistros: registros.length,
    registros,
  }
}
