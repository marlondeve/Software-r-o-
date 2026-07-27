import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"
import { useMemo, useState } from "react"

import { mockConciliacion } from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import {
  construirConciliacionDesdeCiclo,
  construirDetallesConciliacionDesdeFilas,
} from "@/modules/dietas-cocina/lib/construirConciliacionDesdeCiclo"
import {
  formatearMonedaCOP,
  parseDifEconomica,
  parseMonedaCOP,
} from "@/modules/dietas-cocina/lib/resolverTarifaDieta"

export function filtrarFilasConciliacion(
  filas: FilaConciliacion[],
  busqueda: string,
  numeroFactura: string,
  periodo?: string,
  proveedor?: string,
): FilaConciliacion[] {
  const termino = busqueda.trim().toLowerCase()
  const factura = numeroFactura.trim().toLowerCase()

  return filas.filter((fila) => {
    const coincideBusqueda =
      !termino ||
      fila.tipo.toLowerCase().includes(termino) ||
      fila.consistencia.toLowerCase().includes(termino) ||
      fila.tiempo.toLowerCase().includes(termino)

    const coincideFactura =
      !factura ||
      fila.id.includes(factura.replace(/\D/g, "")) ||
      fila.tipo.toLowerCase().includes(factura)

    const coincidePeriodo =
      !periodo ||
      periodo === "periodo" ||
      fila.tiempo.toLowerCase().includes(periodo.replace(/-/g, " "))

    const coincideProveedor =
      !proveedor ||
      proveedor === "proveedor" ||
      fila.tipo.toLowerCase().includes(proveedor.split("-")[0] ?? "")

    return coincideBusqueda && coincideFactura && coincidePeriodo && coincideProveedor
  })
}

export function calcularKpisConciliacion(filas: FilaConciliacion[]) {
  const cantSist = filas.reduce((sum, f) => sum + f.cantSist, 0)
  const cantFact = filas.reduce((sum, f) => sum + f.cantFact, 0)
  const inconsistencias = filas.filter(
    (f) => f.estado !== "coincide" && f.estado !== "conciliado-manual",
  ).length

  const valorCalc = filas.reduce(
    (sum, f) => sum + f.cantSist * parseMonedaCOP(f.tarifa),
    0,
  )
  const diferencia = filas.reduce(
    (sum, f) => sum + parseDifEconomica(f.difEconomica),
    0,
  )
  const valorFact = valorCalc + diferencia

  return [
    {
      label: "Dietas registradas",
      value: cantSist.toLocaleString("es-CO"),
      variant: "default" as const,
    },
    {
      label: "Dietas facturadas",
      value: cantFact.toLocaleString("es-CO"),
      variant: "default" as const,
    },
    {
      label: "Valor calculado",
      value: formatearMonedaCOP(valorCalc),
      variant: "default" as const,
    },
    {
      label: "Valor facturado",
      value: formatearMonedaCOP(valorFact),
      variant: "default" as const,
    },
    {
      label: "Diferencia total",
      value: formatearMonedaCOP(diferencia, true),
      variant: diferencia === 0 ? ("default" as const) : ("warning" as const),
    },
    {
      label: "Inconsistencias",
      value: String(inconsistencias),
      variant: inconsistencias > 0 ? ("destructive" as const) : ("default" as const),
    },
  ]
}

export function useConciliacionFiltrada() {
  const { ordenes } = useCicloBandejas()

  const filasDesdeCiclo = useMemo(
    () => construirConciliacionDesdeCiclo(ordenes),
    [ordenes],
  )

  const detallesDesdeCiclo = useMemo(
    () => construirDetallesConciliacionDesdeFilas(filasDesdeCiclo),
    [filasDesdeCiclo],
  )

  const [estadosManuales, setEstadosManuales] = useState<
    Record<string, FilaConciliacion["estado"]>
  >({})

  const filas = useMemo(
    () =>
      (filasDesdeCiclo.length > 0
        ? filasDesdeCiclo
        : mockConciliacion.filas.map((f) => ({ ...f }))
      ).map((fila) =>
        estadosManuales[fila.id]
          ? { ...fila, estado: estadosManuales[fila.id] }
          : fila,
      ),
    [filasDesdeCiclo, estadosManuales],
  )

  const detalles = useMemo(
    () =>
      filasDesdeCiclo.length > 0
        ? { ...detallesDesdeCiclo, ...mockConciliacion.detalles }
        : mockConciliacion.detalles,
    [filasDesdeCiclo, detallesDesdeCiclo],
  )

  const [busqueda, setBusqueda] = useState("")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [periodo, setPeriodo] = useState("periodo")
  const [proveedor, setProveedor] = useState("proveedor")

  const filasFiltradas = useMemo(
    () =>
      filtrarFilasConciliacion(
        filas,
        busqueda,
        numeroFactura,
        periodo,
        proveedor,
      ),
    [filas, busqueda, numeroFactura, periodo, proveedor],
  )

  const kpis = useMemo(
    () => calcularKpisConciliacion(filasFiltradas),
    [filasFiltradas],
  )

  function actualizarEstadoFila(id: string, estado: FilaConciliacion["estado"]) {
    setEstadosManuales((prev) => ({ ...prev, [id]: estado }))
  }

  return {
    filas,
    filasFiltradas,
    kpis,
    busqueda,
    setBusqueda,
    numeroFactura,
    setNumeroFactura,
    periodo,
    setPeriodo,
    proveedor,
    setProveedor,
    actualizarEstadoFila,
    filtros: mockConciliacion.filtros,
    detalles,
    cargando: false,
    error: null,
  }
}
