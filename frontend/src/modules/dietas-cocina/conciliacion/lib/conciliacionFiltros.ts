import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"
import { useMemo, useState } from "react"

import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"
import { construirConciliacionDesdeCiclo } from "@/modules/dietas-cocina/lib/construirConciliacionDesdeCiclo"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"

export type KpiConciliacionUi = {
  label: string
  value: string
  variant: "default" | "warning" | "destructive"
}

export function calcularKpisConciliacion(filas: FilaConciliacion[]): KpiConciliacionUi[] {
  const sistema = filas.reduce((sum, f) => sum + f.cantidadSistema, 0)
  const tienePlanilla = filas.some((f) => f.cantidadCocina !== null)
  const cocina = filas.reduce((sum, f) => sum + (f.cantidadCocina ?? 0), 0)
  const valorSistema = filas.reduce((sum, f) => sum + f.valorSistema, 0)
  const valorCocina = filas.reduce((sum, f) => sum + (f.valorCocina ?? 0), 0)
  const inconsistencias = filas.filter(
    (f) => f.estado !== "coincide" && f.estado !== "conciliado-manual",
  ).length

  return [
    { label: "Dietas sistema", value: sistema.toLocaleString("es-CO"), variant: "default" },
    {
      label: "Dietas cocina",
      value: tienePlanilla ? cocina.toLocaleString("es-CO") : "—",
      variant: "default",
    },
    {
      label: "Diferencia de cantidad",
      value: tienePlanilla ? String(cocina - sistema) : "—",
      variant: tienePlanilla && cocina !== sistema ? "warning" : "default",
    },
    { label: "Valor sistema", value: formatearMonedaCOP(valorSistema), variant: "default" },
    {
      label: "Valor cocina",
      value: tienePlanilla ? formatearMonedaCOP(valorCocina) : "—",
      variant: "default",
    },
    {
      label: "Líneas con diferencia",
      value: String(inconsistencias),
      variant: inconsistencias > 0 ? "destructive" : "default",
    },
  ]
}

export function rangoUltimosDias(dias: number): { desde: string; hasta: string } {
  const hasta = fechaOperativaHoy()
  const d = new Date(`${hasta}T12:00:00`)
  d.setDate(d.getDate() - (dias - 1))
  return { desde: d.toISOString().slice(0, 10), hasta }
}

export function rangoMesAnterior(): { desde: string; hasta: string } {
  const hoy = fechaOperativaHoy()
  const d = new Date(`${hoy}T12:00:00`)
  const primeroEsteMes = new Date(d.getFullYear(), d.getMonth(), 1)
  const ultimoAnterior = new Date(primeroEsteMes)
  ultimoAnterior.setDate(0)
  const primeroAnterior = new Date(ultimoAnterior.getFullYear(), ultimoAnterior.getMonth(), 1)
  return {
    desde: primeroAnterior.toISOString().slice(0, 10),
    hasta: ultimoAnterior.toISOString().slice(0, 10),
  }
}

export function coincideFiltroEstado(
  estadoFila: FilaConciliacion["estado"],
  filtro: string,
): boolean {
  if (filtro === "todos") return true
  if (filtro === "con-diferencia") {
    return (
      estadoFila === "dif-cantidad" ||
      estadoFila === "dif-tipo" ||
      estadoFila === "con-alerta" ||
      estadoFila === "dif-tarifa"
    )
  }
  if (filtro === "conciliado") return estadoFila === "conciliado-manual"
  return estadoFila === filtro
}

export function useConciliacionFiltrada() {
  const { ordenes } = useCicloBandejas()
  const inicial = rangoUltimosDias(30)
  const [busqueda, setBusqueda] = useState("")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [estado, setEstado] = useState("todos")
  const [desde, setDesde] = useState(inicial.desde)
  const [hasta, setHasta] = useState(inicial.hasta)

  const filas = useMemo(() => construirConciliacionDesdeCiclo(ordenes), [ordenes])

  const filasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return filas.filter((fila) => {
      const coincideBusqueda =
        !q ||
        fila.etiquetaPlanilla.toLowerCase().includes(q) ||
        fila.lineaFcr.toLowerCase().includes(q) ||
        fila.comida.toLowerCase().includes(q)
      return coincideBusqueda && coincideFiltroEstado(fila.estado, estado)
    })
  }, [filas, busqueda, estado])

  const kpis = useMemo(() => calcularKpisConciliacion(filasFiltradas), [filasFiltradas])

  return {
    filas,
    filasFiltradas,
    kpis,
    busqueda,
    setBusqueda,
    numeroFactura,
    setNumeroFactura,
    desde,
    setDesde,
    hasta,
    setHasta,
    estado,
    setEstado,
    actualizarEstadoFila: async () => undefined,
    cargando: false,
    error: null as string | null,
    exportar: async () => undefined,
    cargarPlanilla: async (_archivo: File) => undefined,
    cargarFactura: async (_archivo: File) => undefined,
    guardarCantidadCocina: async () => undefined,
    guardandoCocinaId: null as string | null,
  }
}
