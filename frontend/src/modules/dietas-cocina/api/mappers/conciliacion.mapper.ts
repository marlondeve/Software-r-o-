import type {
  ConciliacionKpisDto,
  DetalleConciliacionDto,
  FilaConciliacionDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { EstadoConciliacion } from "@/modules/dietas-cocina/types/enums"
import type {
  DetalleConciliacion,
  FilaConciliacion,
  RegistroSistema,
} from "@/modules/dietas-cocina/types/reconciliation"
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

function normalizarEstado(valor: unknown): EstadoConciliacion {
  const v = String(valor ?? "pendiente").toLowerCase()
  const mapa: Record<string, EstadoConciliacion> = {
    coincide: "coincide",
    "dif-cantidad": "dif-cantidad",
    "dif-tipo": "dif-tipo",
    "dif-tarifa": "dif-tarifa",
    pendiente: "pendiente",
    "con-alerta": "con-alerta",
    "conciliado-manual": "conciliado-manual",
    conciliado: "conciliado-manual",
    en_revision: "pendiente",
    "en-revision": "pendiente",
  }
  return mapa[v] ?? "pendiente"
}

export function mapConciliacionDtoToDomain(dto: FilaConciliacionDto): FilaConciliacion {
  const cantidadSistema = leerNumero(dto.cantidadSistema)
  const cocinaRaw = dto.cantidadCocina
  const cantidadCocina =
    cocinaRaw === undefined || cocinaRaw === null ? null : leerNumero(cocinaRaw)
  const valorSistema = leerNumero(dto.valorSistema)
  const valorCocina =
    dto.valorCocina === undefined || dto.valorCocina === null
      ? null
      : leerNumero(dto.valorCocina)

  return {
    id: String(dto.id ?? ""),
    comida: leerTexto(dto.comida),
    lineaFcr: leerTexto(dto.lineaFcr),
    etiquetaPlanilla: leerTexto(dto.etiquetaPlanilla, dto.lineaFcr),
    tarifa: leerNumero(dto.tarifa),
    cantidadSistema,
    cantidadCocina,
    valorSistema,
    valorCocina,
    diferenciaCantidad: leerNumero(
      dto.diferenciaCantidad,
      cantidadCocina === null ? 0 : cantidadCocina - cantidadSistema,
    ),
    diferenciaEconomica:
      dto.diferenciaEconomica === undefined || dto.diferenciaEconomica === null
        ? valorCocina === null
          ? null
          : valorCocina - valorSistema
        : leerNumero(dto.diferenciaEconomica),
    sinEtiqueta: leerNumero(dto.sinEtiqueta),
    huerfanas: leerNumero(dto.huerfanas),
    estado: normalizarEstado(dto.estado),
    motivo: dto.motivo,
    observaciones: dto.observaciones,
    numeroFactura: dto.numeroFactura,
    periodoDesde: dto.periodoDesde,
    periodoHasta: dto.periodoHasta,
  }
}

export function mapKpisConciliacionApi(kpis: ConciliacionKpisDto[] | unknown) {
  if (!Array.isArray(kpis)) return []

  const sinPlanilla = kpis.some((kpi) =>
    leerTexto(kpi.comparacion).toLowerCase().includes("cargue"),
  )

  return kpis.map((kpi) => {
    const formato = String(kpi.formato ?? "numero").toLowerCase()
    const valor = leerNumero(kpi.valor, kpi.value)
    const comparacion = leerTexto(kpi.comparacion)
    const clave = String(kpi.clave ?? "").toLowerCase()
    const cocinaSinPlanilla =
      sinPlanilla &&
      (clave === "dietas_cocina" ||
        clave === "valor_cocina" ||
        clave === "diferencia_cantidad" ||
        comparacion.toLowerCase().includes("cargue"))
    let value = String(valor)

    if (cocinaSinPlanilla) {
      value = "—"
    } else if (formato === "moneda") {
      value = formatearMonedaCOP(valor, true).replace(/^\+\$/, "$")
    } else {
      value = valor.toLocaleString("es-CO")
    }

    const variant =
      clave === "inconsistencias" && valor > 0
        ? ("destructive" as const)
        : clave === "diferencia_cantidad" && valor !== 0
          ? ("warning" as const)
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

function badgePorEstado(estado: string): string {
  const mapa: Record<string, string> = {
    coincide: "Coincide",
    "dif-cantidad": "Diferencia de cantidad",
    "dif-tipo": "Tipo distinto al cobrado",
    "dif-tarifa": "Diferencia de tarifa",
    pendiente: "Planilla pendiente",
    "con-alerta": "Con alerta",
    "conciliado-manual": "Conciliado",
    conciliado: "Conciliado",
  }
  return mapa[estado.toLowerCase()] ?? estado
}

export function mapDetalleConciliacionDto(dto: DetalleConciliacionDto): DetalleConciliacion {
  const linea = mapConciliacionDtoToDomain(dto.linea ?? {})
  const registros: RegistroSistema[] = (dto.registros ?? []).map((evento) => ({
    fecha: String(evento.fecha ?? ""),
    paciente: String(evento.paciente ?? ""),
    cedula: evento.cedula,
    pabellon: evento.pabellon,
    habitacion: evento.habitacion ? String(evento.habitacion) : "—",
    estado: String(evento.estadoDieta ?? ""),
    estadoOrden: evento.estadoOrden,
    tipoClinico: evento.tipoClinico,
    lineaFcr: evento.lineaFcr,
    tieneEtiqueta: evento.tieneEtiqueta,
    esHuerfana: evento.esHuerfana,
    alertas: evento.alertas,
  }))

  const cocinaTxt =
    linea.cantidadCocina === null
      ? "—"
      : formatearMonedaCOP(linea.valorCocina ?? 0)

  let diferencia = "Sin planilla de cocina"
  if (linea.cantidadCocina !== null) {
    const partes: string[] = []
    if (linea.diferenciaCantidad !== 0) {
      partes.push(
        `${linea.diferenciaCantidad > 0 ? "+" : ""}${linea.diferenciaCantidad} unidades`,
      )
    }
    if (linea.diferenciaEconomica != null && linea.diferenciaEconomica !== 0) {
      partes.push(formatearMonedaCOP(linea.diferenciaEconomica, true))
    }
    diferencia = partes.length > 0 ? partes.join(" / ") : "Sin diferencia"
  }

  return {
    titulo: `${linea.etiquetaPlanilla} · ${linea.comida}`,
    codigo: `Cód. ${linea.id.slice(0, 8) || "—"}`,
    badge: badgePorEstado(linea.estado),
    sistema: {
      unidades: linea.cantidadSistema,
      valor: formatearMonedaCOP(linea.valorSistema),
    },
    cocina: {
      unidades: linea.cantidadCocina,
      valor: cocinaTxt,
    },
    diferencia,
    totalRegistros: registros.length,
    registros,
    alertas: dto.alertas ?? [],
    recomendaciones: dto.recomendaciones ?? [],
  }
}
