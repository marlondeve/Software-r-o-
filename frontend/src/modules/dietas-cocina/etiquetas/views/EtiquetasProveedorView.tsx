import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"

import { CardGridSkeleton } from "@/components/shared/skeletons"
import { TablaPaginacion } from "@/components/shared/TablaPaginacion"
import { usePaginacionTabla } from "@/lib/usePaginacionTabla"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { EtiquetaCard } from "@/modules/dietas-cocina/etiquetas/components/EtiquetaCard"
import { EtiquetasFiltrosPanel } from "@/modules/dietas-cocina/etiquetas/components/EtiquetasFiltrosPanel"
import { EtiquetasKpiGrid } from "@/modules/dietas-cocina/etiquetas/components/EtiquetasKpiGrid"
import { EtiquetasProgresoDialog } from "@/modules/dietas-cocina/etiquetas/components/EtiquetasProgresoDialog"
import { EtiquetasToolbar } from "@/modules/dietas-cocina/etiquetas/components/EtiquetasToolbar"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  clasificarEtiquetaRespectoCenso,
  etiquetaEnFlujoCenso,
} from "@/modules/dietas-cocina/lib/clasificarEtiquetaCenso"
import {
  COMIDAS_OPERATIVAS,
  obtenerComidaActivaOperativa,
  subtituloFechaOperativa,
} from "@/modules/dietas-cocina/config/operativa-defaults"
import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  calcularKpisEtiquetasProveedor,
  etiquetaCoincideEstados,
  etiquetaCoincideFiltros,
  etiquetaFueraDeFlujoProveedor,
  etiquetaRecibidaEnfermeria,
  FILTROS_ESTADO_ETIQUETA_INICIAL,
  filtrosDesdeKpiEtiqueta,
  type FiltrosEstadoEtiqueta,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEstilos"
import {
  imprimirEtiquetaPruebaPdf,
  imprimirEtiquetasPdf,
} from "@/modules/dietas-cocina/etiquetas/lib/imprimirEtiquetasPdf"
import { devLog } from "@/lib/devLog"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { filtrarEtiquetasDelPeriodoOperativo } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import {
  puedeImprimirEtiqueta,
  puedeReimprimirEtiqueta,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
interface EtiquetasLocationState {
  preseleccion?: string[]
}

function opcionesConTodos(
  valores: Iterable<string>,
  opcionTodos: string,
): string[] {
  return [opcionTodos, ...Array.from(new Set(valores)).sort()]
}

export function EtiquetasProveedorView() {
  const apiActiva = usarApiDietasCocina()
  const data = mockEtiquetas
  const location = useLocation()
  const { etiquetas: etiquetasLogistica, marcarEtiquetasImpresas, reimprimirEtiquetas, rehidratarDesdeStorage, hidrato } =
    useCicloBandejas()
  const { filas } = useDietasOperativas()
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(() =>
    apiActiva ? obtenerComidaActivaOperativa() : data.comidaActiva,
  )
  const [filtrosEstado, setFiltrosEstado] = useState<FiltrosEstadoEtiqueta>(
    FILTROS_ESTADO_ETIQUETA_INICIAL,
  )
  const [pabellon, setPabellon] = useState("Todos los Pabellones")
  const [habitacion, setHabitacion] = useState("Todas las Habitaciones")
  const [tipoDieta, setTipoDieta] = useState("Todas")
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [kpiActivo, setKpiActivo] = useState<string | undefined>()
  const [imprimiendo, setImprimiendo] = useState(false)
  const [reimprimiendo, setReimprimiendo] = useState(false)
  const [imprimiendoPrueba, setImprimiendoPrueba] = useState(false)

  useEffect(() => {
    if (!apiActiva) return
    rehidratarDesdeStorage()
  }, [apiActiva, rehidratarDesdeStorage])

  useEffect(() => {
    const state = location.state as EtiquetasLocationState | null
    if (state?.preseleccion?.length) {
      setSeleccionados(new Set(state.preseleccion))
    }
  }, [location.state])

  const mostrarRecibidasEnfermeria = kpiActivo === "recibidas-enfermeria"
  const mostrarFueraFlujo = kpiActivo === "fuera-flujo"

  const etiquetasOperativas = useMemo(
    () =>
      filtrarEtiquetasDelPeriodoOperativo(etiquetasLogistica, {
        comida: comidaActiva,
      }),
    [etiquetasLogistica, comidaActiva],
  )

  const clasificacionPorId = useMemo(() => {
    const mapa = new Map<
      string,
      ReturnType<typeof clasificarEtiquetaRespectoCenso>
    >()
    for (const etiqueta of etiquetasOperativas) {
      mapa.set(etiqueta.id, clasificarEtiquetaRespectoCenso(etiqueta, filas))
    }
    return mapa
  }, [etiquetasOperativas, filas])

  const etiquetasEnCocina = useMemo(
    () =>
      etiquetasOperativas.filter((etiqueta) => {
        if (mostrarFueraFlujo) {
          return !etiquetaEnFlujoCenso(etiqueta, filas)
        }
        if (mostrarRecibidasEnfermeria) {
          return (
            etiquetaEnFlujoCenso(etiqueta, filas) &&
            etiquetaRecibidaEnfermeria(etiqueta.estadoLogistica)
          )
        }
        // Listado completo del turno (incluye fuera de censo); no se ocultan.
        return !etiquetaFueraDeFlujoProveedor(etiqueta.estadoLogistica)
      }),
    [
      etiquetasOperativas,
      mostrarRecibidasEnfermeria,
      mostrarFueraFlujo,
      filas,
    ],
  )

  const pabellonesDisponibles = useMemo(
    () => opcionesConTodos(etiquetasEnCocina.map((e) => e.pabellon), "Todos los Pabellones"),
    [etiquetasEnCocina],
  )

  const habitacionesDisponibles = useMemo(
    () =>
      opcionesConTodos(etiquetasEnCocina.map((e) => e.habitacion), "Todas las Habitaciones"),
    [etiquetasEnCocina],
  )

  const tiposDietaDisponibles = useMemo(
    () => opcionesConTodos(etiquetasEnCocina.map((e) => e.tipoDieta), "Todas"),
    [etiquetasEnCocina],
  )

  useEffect(() => {
    if (!pabellonesDisponibles.includes(pabellon)) {
      setPabellon("Todos los Pabellones")
    }
  }, [pabellonesDisponibles, pabellon])

  useEffect(() => {
    if (!habitacionesDisponibles.includes(habitacion)) {
      setHabitacion("Todas las Habitaciones")
    }
  }, [habitacionesDisponibles, habitacion])

  useEffect(() => {
    if (!tiposDietaDisponibles.includes(tipoDieta)) {
      setTipoDieta("Todas")
    }
  }, [tiposDietaDisponibles, tipoDieta])

  const kpisConLogistica = useMemo(
    () =>
      calcularKpisEtiquetasProveedor(etiquetasOperativas, comidaActiva, {
        esEnFlujoCenso: (etiqueta) => etiquetaEnFlujoCenso(etiqueta, filas),
      }),
    [etiquetasOperativas, comidaActiva, filas],
  )

  const etiquetasFiltradas = useMemo(() => {
    return etiquetasEnCocina.filter((etiqueta) => {
      if (mostrarFueraFlujo || mostrarRecibidasEnfermeria) {
        return etiquetaCoincideFiltros(etiqueta, pabellon, habitacion, tipoDieta)
      }
      if (!etiquetaCoincideEstados(etiqueta, filtrosEstado)) return false
      if (!etiquetaCoincideFiltros(etiqueta, pabellon, habitacion, tipoDieta)) {
        return false
      }
      return true
    })
  }, [
    etiquetasEnCocina,
    filtrosEstado,
    pabellon,
    habitacion,
    tipoDieta,
    mostrarRecibidasEnfermeria,
    mostrarFueraFlujo,
  ])

  const paginacionEtiquetas = usePaginacionTabla(etiquetasFiltradas, {
    resetKey: `${comidaActiva}-${kpiActivo ?? ""}-${pabellon}-${habitacion}-${tipoDieta}-${JSON.stringify(filtrosEstado)}-${mostrarFueraFlujo}`,
  })

  const idsVisibles = useMemo(
    () => new Set(etiquetasFiltradas.map((etiqueta) => etiqueta.id)),
    [etiquetasFiltradas],
  )

  const seleccionadosVisibles = useMemo(
    () => [...seleccionados].filter((id) => idsVisibles.has(id)).length,
    [seleccionados, idsVisibles],
  )

  const todoSeleccionado =
    etiquetasFiltradas.length > 0 &&
    seleccionadosVisibles === etiquetasFiltradas.length

  const parcialmenteSeleccionado =
    seleccionadosVisibles > 0 && !todoSeleccionado

  function limpiarFiltros() {
    setFiltrosEstado(FILTROS_ESTADO_ETIQUETA_INICIAL)
    setPabellon("Todos los Pabellones")
    setHabitacion("Todas las Habitaciones")
    setTipoDieta("Todas")
    setKpiActivo(undefined)
  }

  function aplicarFiltroKpi(kpiId: string) {
    setKpiActivo(kpiId)
    setFiltrosEstado((prev) => ({ ...prev, ...filtrosDesdeKpiEtiqueta(kpiId) }))
  }

  function cambiarComida(id: TiempoComida) {
    setComidaActiva(id)
    setSeleccionados(new Set())
    setKpiActivo(undefined)
  }

  function toggleEtiqueta(id: string, checked: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleTodas(checked: boolean) {
    if (checked) {
      setSeleccionados(new Set(etiquetasFiltradas.map((etiqueta) => etiqueta.id)))
    } else {
      setSeleccionados((prev) => {
        const next = new Set(prev)
        for (const etiqueta of etiquetasFiltradas) next.delete(etiqueta.id)
        return next
      })
    }
  }

  async function reimprimirSeleccionadas() {
    if (imprimiendo || reimprimiendo || imprimiendoPrueba) return
    const etiquetas = etiquetasFiltradas.filter(
      (etiqueta) =>
        seleccionados.has(etiqueta.id) && puedeReimprimirEtiqueta(etiqueta),
    )
    if (etiquetas.length === 0) {
      demoToast("Selecciona etiquetas ya impresas para reimprimir.")
      return
    }

    setReimprimiendo(true)
    try {
      const fecha = new Date().toISOString().slice(0, 10)
      await imprimirEtiquetasPdf({
        etiquetas,
        nombreArchivo: `etiquetas-reimpresion-${comidaActiva}-${fecha}.pdf`,
        usarApi: apiActiva,
      })
      reimprimirEtiquetas(etiquetas.map((e) => e.id))
    } catch (error) {
      devLog.error("Error al reimprimir etiquetas:", error)
      window.alert("No se pudo generar el PDF de reimpresión.")
    } finally {
      setReimprimiendo(false)
    }
  }

  async function imprimirSeleccionadas() {
    if (imprimiendo || reimprimiendo || imprimiendoPrueba) return
    const etiquetas = etiquetasFiltradas.filter(
      (etiqueta) =>
        seleccionados.has(etiqueta.id) && puedeImprimirEtiqueta(etiqueta),
    )
    if (etiquetas.length === 0) {
      demoToast(
        "Selecciona etiquetas generadas o pendientes de imprimir. Las ya impresas requieren reimpresión explícita.",
      )
      return
    }

    setImprimiendo(true)
    try {
      const fecha = new Date().toISOString().slice(0, 10)
      await imprimirEtiquetasPdf({
        etiquetas,
        nombreArchivo: `etiquetas-${comidaActiva}-${fecha}.pdf`,
        usarApi: apiActiva,
      })
      marcarEtiquetasImpresas(etiquetas.map((e) => e.id))
    } catch (error) {
      devLog.error("Error al generar PDF de etiquetas:", error)
      window.alert(
        "No se pudo generar el PDF. Selecciona al menos una etiqueta e inténtalo de nuevo.",
      )
    } finally {
      setImprimiendo(false)
    }
  }

  /** Misma plantilla térmica del servidor (o html2canvas en modo mock). */
  async function imprimirEtiquetaPrueba() {
    if (imprimiendo || reimprimiendo || imprimiendoPrueba) return
    setImprimiendoPrueba(true)
    try {
      await imprimirEtiquetaPruebaPdf(apiActiva)
      demoToast("PDF de prueba generado (mismo layout que la impresión real).", "success")
    } catch (error) {
      devLog.error("Error al generar etiqueta de prueba:", error)
      window.alert("No se pudo generar la etiqueta de prueba.")
    } finally {
      setImprimiendoPrueba(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Etiquetas de dietas"
        subtitle={apiActiva ? subtituloFechaOperativa() : data.fechaReferencia}
      />

      <DietasComidaTabs
        comidas={apiActiva ? COMIDAS_OPERATIVAS : data.comidas}
        comidaActiva={comidaActiva}
        onComidaChange={cambiarComida}
      />

      <EtiquetasKpiGrid
        kpis={kpisConLogistica}
        kpiActivo={kpiActivo}
        onKpiClick={aplicarFiltroKpi}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <EtiquetasFiltrosPanel
          filtrosEstado={filtrosEstado}
          pabellon={pabellon}
          habitacion={habitacion}
          tipoDieta={tipoDieta}
          pabellones={pabellonesDisponibles}
          habitaciones={habitacionesDisponibles}
          tiposDieta={tiposDietaDisponibles}
          onFiltrosEstadoChange={(next) => {
            setFiltrosEstado(next)
            setKpiActivo(undefined)
          }}
          onPabellonChange={setPabellon}
          onHabitacionChange={setHabitacion}
          onTipoDietaChange={setTipoDieta}
          onLimpiar={limpiarFiltros}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <EtiquetasToolbar
            totalVisibles={etiquetasFiltradas.length}
            seleccionados={seleccionadosVisibles}
            todoSeleccionado={todoSeleccionado}
            parcialmenteSeleccionado={parcialmenteSeleccionado}
            imprimiendo={imprimiendo}
            reimprimiendo={reimprimiendo}
            imprimiendoPrueba={imprimiendoPrueba}
            onToggleTodas={toggleTodas}
            onImprimir={imprimirSeleccionadas}
            onReimprimir={reimprimirSeleccionadas}
            onImprimirPrueba={imprimirEtiquetaPrueba}
          />

          {apiActiva && !hidrato ? (
            <CardGridSkeleton count={4} />
          ) : etiquetasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                No hay etiquetas para este turno
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {mostrarFueraFlujo
                  ? "No hay etiquetas fuera de flujo (salida clínica o sin solicitud) en este turno."
                  : mostrarRecibidasEnfermeria
                    ? "No hay etiquetas recibidas por enfermería para este tiempo de comida."
                    : "Ajusta los filtros o cambia el tiempo de comida. Para ver las ya entregadas, pulsa el KPI Recibidas Enfermería."}
              </p>
            </div>
          ) : (
            <>
            {filas.length > 0 &&
              etiquetasOperativas.some((e) => !etiquetaEnFlujoCenso(e, filas)) &&
              !mostrarFueraFlujo && (
                <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                  Los KPIs cuentan solo dietas activas del censo (como Cocina).
                  Las etiquetas de salida clínica o sin solicitud siguen
                  visibles con distintivo y en el KPI «Fuera de flujo».
                </p>
              )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {paginacionEtiquetas.filasPagina.map((etiqueta) => {
                const clasificacion = clasificacionPorId.get(etiqueta.id)
                return (
                  <EtiquetaCard
                    key={etiqueta.id}
                    etiqueta={etiqueta}
                    seleccionada={seleccionados.has(etiqueta.id)}
                    motivoFueraFlujo={
                      clasificacion && !clasificacion.enFlujo
                        ? clasificacion.motivo
                        : undefined
                    }
                    onSeleccionChange={(checked) =>
                      toggleEtiqueta(etiqueta.id, checked)
                    }
                  />
                )
              })}
            </div>
            <TablaPaginacion
              paginaDesde={paginacionEtiquetas.paginaDesde}
              paginaHasta={paginacionEtiquetas.paginaHasta}
              total={paginacionEtiquetas.total}
              paginaActual={paginacionEtiquetas.paginaActual}
              totalPaginas={paginacionEtiquetas.totalPaginas}
              onCambiarPagina={paginacionEtiquetas.setPaginaActual}
            />
            </>
          )}
        </div>
      </div>
      <EtiquetasProgresoDialog
        open={imprimiendo || reimprimiendo || imprimiendoPrueba}
        titulo={
          imprimiendoPrueba
            ? "Preparando PDF (1 etiqueta)…"
            : `Preparando PDF (${imprimiendo || reimprimiendo ? seleccionadosVisibles : 0} etiquetas)…`
        }
        descripcion={
          apiActiva
            ? "El servidor está generando el archivo de impresión."
            : "Generando el PDF en este dispositivo."
        }
      />
    </div>
  )
}
