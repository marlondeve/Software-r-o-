import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { useMemo, useState, useEffect, useRef } from "react"
import { FileText, RefreshCw, Tag } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { TablePageSkeleton } from "@/components/shared/skeletons"
import { usePaginacionTabla } from "@/lib/usePaginacionTabla"
import { CocinaBarraDespacho } from "@/modules/dietas-cocina/cocina/components/CocinaBarraDespacho"
import { CocinaDetalleSheet } from "@/modules/dietas-cocina/cocina/components/CocinaDetalleSheet"
import { CocinaFiltrosBar } from "@/modules/dietas-cocina/cocina/components/CocinaFiltrosBar"
import { CocinaKpiGrid } from "@/modules/dietas-cocina/cocina/components/CocinaKpiGrid"
import { CocinaTabla } from "@/modules/dietas-cocina/cocina/components/CocinaTabla"
import { mockCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  calcularKpisCocina,
  filtrosDesdeKpiCocina,
  ordenCoincideFiltros,
  type FiltrosCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaFiltros"
import {
  ordenarOrdenesCocinaConListaFija,
  sincronizarOrdenListaCocina,
  type OrdenListaCocina,
} from "@/modules/dietas-cocina/cocina/lib/ordenarOrdenesCocina"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { EtiquetasProgresoDialog } from "@/modules/dietas-cocina/etiquetas/components/EtiquetasProgresoDialog"
import { imprimirEtiquetasPdf } from "@/modules/dietas-cocina/etiquetas/lib/imprimirEtiquetasPdf"
import { RUTAS_LOGISTICA } from "@/modules/dietas-cocina/lib/rutasLogistica"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { BannerModuloSinConexion } from "@/modules/dietas-cocina/components/BannerModuloSinConexion"
import {
  demoToast,
  descargarArchivoDemo,
} from "@/modules/dietas-cocina/lib/demoFeedback"
import { descargarBlob } from "@/modules/dietas-cocina/lib/descargarBlob"
import {
  descargarReporteCocinaExcel,
  nombreArchivoReporteCocina,
} from "@/modules/dietas-cocina/api/services/cocina-reporte.service"
import { labelEstadoVisibleCocina } from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import { TEXTO_ALERTA_SALIDA_CLINICA_SOSTENIDA } from "@/modules/dietas-cocina/lib/labelEstadoOperativo"
import {
  formatearFechaOperativa,
  formatearHoraActualizacion,
} from "@/modules/dietas-cocina/lib/formatearFechaOperativa"
import {
  puedeDespachar,
  puedeGenerarEtiqueta,
  puedeMarcarLista,
  motivoNoMarcarLista,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
const FILTROS_INICIALES: FiltrosCocina = {
  pabellon: "Todos",
  habitacion: "Todas",
  tipoDieta: "Todos",
  consistencia: "Todas",
  estadoCocina: "Todos",
  seguimiento: "Todos",
  soloAislados: false,
  busqueda: "",
}

function opcionesConTodos(valores: Iterable<string>, opcionTodos: string): string[] {
  return [opcionTodos, ...Array.from(new Set(valores)).sort()]
}

export function CocinaProveedorView() {
  const apiActiva = usarApiDietasCocina()
  const data = mockCocina
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    ordenes,
    hidrato,
    marcarEnPreparacion,
    marcarComoLista,
    registrarDespacho,
    rehidratarDesdeStorage,
    generarEtiquetas,
    marcarEtiquetasImpresas,
    actualizarChecklist,
    sincronizarChecklistOrden,
    getEtiquetaByOrdenId,
  } = useCicloBandejas()
  const { sincronizarCenso } = useDietasOperativas()

  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(() =>
    apiActiva ? obtenerComidaActivaOperativa() : data.comidaActiva,
  )
  const [filtros, setFiltros] = useState<FiltrosCocina>(FILTROS_INICIALES)
  const [kpiActivo, setKpiActivo] = useState<string | undefined>()
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenCocina | null>(null)
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(() => new Date())
  const [progreso, setProgreso] = useState<{
    titulo: string
    descripcion: string
  } | null>(null)
  const [descargandoReporte, setDescargandoReporte] = useState(false)

  useEffect(() => {
    const q = searchParams.get("q")?.trim()
    if (q) {
      setFiltros((prev) => ({ ...prev, busqueda: q }))
    }
  }, [searchParams])

  useEffect(() => {
    setUltimaActualizacion(new Date())
  }, [ordenes])

  const ordenListaRef = useRef<OrdenListaCocina>(new Map())
  const comidaOrdenRef = useRef(comidaActiva)

  const ordenesFiltradas = useMemo(() => {
    if (comidaOrdenRef.current !== comidaActiva) {
      ordenListaRef.current = new Map()
      comidaOrdenRef.current = comidaActiva
    }

    const filtradas = ordenes.filter(
      (orden) =>
        orden.comida === comidaActiva &&
        ordenCoincideFiltros(orden, filtros, getEtiquetaByOrdenId),
    )

    // Congela la posición al primer ingreso: un sync del censo que mueva
    // cama/pabellón ya no reordena la tabla mientras el usuario trabaja.
    ordenListaRef.current = sincronizarOrdenListaCocina(
      filtradas,
      ordenListaRef.current,
    )
    return ordenarOrdenesCocinaConListaFija(filtradas, ordenListaRef.current)
  }, [ordenes, comidaActiva, filtros, getEtiquetaByOrdenId])

  const paginacionCocina = usePaginacionTabla(ordenesFiltradas, {
    resetKey: `${comidaActiva}-${JSON.stringify(filtros)}`,
  })

  const kpis = useMemo(
    () => calcularKpisCocina(ordenes, comidaActiva, getEtiquetaByOrdenId),
    [ordenes, comidaActiva, getEtiquetaByOrdenId],
  )

  const opcionesFiltros = useMemo(() => {
    if (!apiActiva) {
      return {
        pabellones: data.pabellones,
        habitaciones: data.habitaciones,
        tiposDieta: data.tiposDieta,
        consistencias: data.consistencias,
      }
    }
    return {
      pabellones: opcionesConTodos(ordenes.map((o) => o.pabellon), "Todos"),
      habitaciones: opcionesConTodos(ordenes.map((o) => o.habitacion), "Todas"),
      tiposDieta: opcionesConTodos(ordenes.map((o) => o.tipoDieta), "Todos"),
      consistencias: opcionesConTodos(ordenes.map((o) => o.consistencia), "Todas"),
    }
  }, [apiActiva, data, ordenes])

  const idsVisibles = useMemo(
    () => new Set(ordenesFiltradas.map((o) => o.id)),
    [ordenesFiltradas],
  )

  const seleccionadosVisibles = useMemo(
    () => [...seleccionados].filter((id) => idsVisibles.has(id)).length,
    [seleccionados, idsVisibles],
  )

  const puedeDespachoSeleccion = useMemo(() => {
    const ids = [...seleccionados].filter((id) => idsVisibles.has(id))
    return ids.some((id) => {
      const orden = ordenes.find((o) => o.id === id)
      return orden && puedeDespachar(orden, getEtiquetaByOrdenId(id))
    })
  }, [ordenes, seleccionados, idsVisibles, getEtiquetaByOrdenId])

  const ordenDetalleActual = useMemo(() => {
    if (!ordenDetalle) return null
    return ordenes.find((o) => o.id === ordenDetalle.id) ?? ordenDetalle
  }, [ordenes, ordenDetalle])

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
    setKpiActivo(undefined)
  }

  function aplicarFiltroKpi(kpiId: string) {
    setKpiActivo(kpiId)
    setFiltros((prev) => ({ ...prev, ...filtrosDesdeKpiCocina(kpiId) }))
  }

  function cambiarComida(id: TiempoComida) {
    setComidaActiva(id)
    setSeleccionados(new Set())
  }

  function toggleOrden(id: string, checked: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleTodas(checked: boolean) {
    if (checked) {
      setSeleccionados(new Set(ordenesFiltradas.map((o) => o.id)))
    } else {
      setSeleccionados((prev) => {
        const next = new Set(prev)
        for (const o of ordenesFiltradas) next.delete(o.id)
        return next
      })
    }
  }

  function idsSeleccionados(): string[] {
    return [...seleccionados].filter((id) => idsVisibles.has(id))
  }

  function ejecutarDespacho() {
    const ids = idsSeleccionados().filter((id) => {
      const orden = ordenes.find((o) => o.id === id)
      return orden && puedeDespachar(orden, getEtiquetaByOrdenId(id))
    })
    if (ids.length === 0) {
      demoToast(
        "Solo se pueden despachar bandejas listas con etiqueta impresa.",
      )
      return
    }
    registrarDespacho(ids)
  }

  function abrirDetalle(orden: OrdenCocina) {
    setOrdenDetalle(orden)
    setDetalleAbierto(true)
  }

  function generarEtiquetasSeleccionadas() {
    if (progreso) return
    const seleccion = idsSeleccionados()
    const ids = seleccion.filter((id) => {
      const orden = ordenes.find((o) => o.id === id)
      return orden && puedeGenerarEtiqueta(orden, getEtiquetaByOrdenId(id))
    })
    const omitidas = seleccion.length - ids.length

    if (ids.length === 0) {
      demoToast(
        "Selecciona bandejas en estado lista, con checklist obligatorio completo y sin etiqueta generada.",
      )
      return
    }

    if (omitidas > 0) {
      demoToast(
        `${omitidas} bandeja${omitidas === 1 ? "" : "s"} de la selección no están listas para generar (estado, checklist o ya tienen etiqueta).`,
      )
    }

    setProgreso({
      titulo: "Generando etiquetas…",
      descripcion: `Creando registros para ${ids.length} bandeja${ids.length === 1 ? "" : "s"}.`,
    })
    void generarEtiquetas(ids)
      .then((etiquetaIds) => {
        if (etiquetaIds.length === 0) {
          demoToast("No se generaron etiquetas para las bandejas seleccionadas.", "error")
          return
        }
        if (etiquetaIds.length < ids.length) {
          demoToast(
            `Se generaron ${etiquetaIds.length} de ${ids.length}. Revisa las pendientes e intenta de nuevo.`,
            "error",
          )
        }
        navigate(RUTAS_LOGISTICA.impresion, {
          state: { preseleccion: etiquetaIds },
        })
      })
      .catch((error) => {
        const parciales =
          error &&
          typeof error === "object" &&
          "etiquetaIdsParciales" in error &&
          Array.isArray((error as { etiquetaIdsParciales?: string[] }).etiquetaIdsParciales)
            ? (error as { etiquetaIdsParciales: string[] }).etiquetaIdsParciales
            : null

        demoToast(
          error instanceof Error
            ? error.message
            : "No se pudieron generar las etiquetas.",
          "error",
        )

        if (parciales && parciales.length > 0) {
          navigate(RUTAS_LOGISTICA.impresion, {
            state: { preseleccion: parciales },
          })
        }
      })
      .finally(() => setProgreso(null))
  }

  async function imprimirEtiqueta(orden: OrdenCocina) {
    if (progreso) return
    const etiqueta = getEtiquetaByOrdenId(orden.id)
    const etiquetaId = orden.etiquetaId ?? etiqueta?.id

    if (etiqueta) {
      setProgreso({
        titulo: "Preparando PDF (1 etiqueta)…",
        descripcion: "El servidor está generando el archivo de impresión.",
      })
      try {
        const fecha = new Date().toISOString().slice(0, 10)
        await imprimirEtiquetasPdf({
          etiquetas: [etiqueta],
          nombreArchivo: `etiquetas-${orden.comida}-${fecha}.pdf`,
          usarApi: apiActiva,
        })
        marcarEtiquetasImpresas([etiqueta.id])
        demoToast("Etiqueta impresa. Ya puedes registrar el despacho.", "success")
      } catch (error) {
        demoToast(
          error instanceof Error
            ? error.message
            : "No se pudo generar el PDF de la etiqueta.",
          "error",
        )
      } finally {
        setProgreso(null)
      }
      return
    }

    if (etiquetaId) {
      navigate(RUTAS_LOGISTICA.impresion, {
        state: { preseleccion: [etiquetaId] },
      })
      return
    }

    setProgreso({
      titulo: "Generando etiquetas…",
      descripcion: "Creando el registro de la etiqueta para esta bandeja.",
    })
    void generarEtiquetas([orden.id])
      .then((ids) => {
        if (ids.length === 0) {
          demoToast("No se pudo generar la etiqueta para esta bandeja.", "error")
          return
        }
        navigate(RUTAS_LOGISTICA.impresion, {
          state: { preseleccion: ids },
        })
      })
      .catch((error) => {
        demoToast(
          error instanceof Error
            ? error.message
            : "No se pudo generar la etiqueta.",
          "error",
        )
      })
      .finally(() => setProgreso(null))
  }

  function escaparCsv(valor: string): string {
    if (/[",\n\r]/.test(valor)) {
      return `"${valor.replace(/"/g, '""')}"`
    }
    return valor
  }

  function generarReporteDemoCsv() {
    const encabezados = [
      "Estado",
      "Pabellón",
      "Habitación",
      "Paciente",
      "Tipo dieta",
      "Consistencia",
      "Alertas",
      "Observaciones",
      "Etiqueta impresa",
    ]
    const filas = ordenesFiltradas.map((orden) => {
      const etiqueta = getEtiquetaByOrdenId(orden.id)
      const alertas = [
        orden.aislado ? "Aislado" : "",
        orden.alergias.length > 0 ? `Alergia: ${orden.alergias.join(", ")}` : "",
        orden.salidaClinicaSostenida ? TEXTO_ALERTA_SALIDA_CLINICA_SOSTENIDA : "",
      ]
        .filter(Boolean)
        .join("; ")
      return [
        labelEstadoVisibleCocina(orden, etiqueta),
        orden.pabellon,
        orden.habitacion,
        orden.paciente,
        orden.tipoDieta,
        orden.consistencia,
        alertas,
        orden.observaciones ?? "",
        orden.etiquetaImpresa ? "Sí" : "No",
      ].map(escaparCsv)
    })
    const contenido = [encabezados.join(","), ...filas.map((f) => f.join(","))].join("\n")
    descargarArchivoDemo(
      contenido,
      `reporte-cocina-${comidaActiva}.csv`,
      "text/csv;charset=utf-8",
    )
    demoToast("Reporte CSV generado (modo demo).")
  }

  function generarReporte() {
    if (apiActiva) {
      setDescargandoReporte(true)
      void descargarReporteCocinaExcel({ comida: comidaActiva, filtros })
        .then((blob) => {
          descargarBlob(blob, nombreArchivoReporteCocina(comidaActiva))
          demoToast("Reporte Excel generado.")
        })
        .catch((error) => {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo generar el reporte.",
            "error",
          )
        })
        .finally(() => setDescargandoReporte(false))
      return
    }

    generarReporteDemoCsv()
  }

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Preparación de dietas"
        subtitle={`${formatearFechaOperativa(ultimaActualizacion)} · Actualizado ${formatearHoraActualizacion(ultimaActualizacion)}`}
      />

      {apiActiva && <BannerModuloSinConexion datosEnCache />}

      {apiActiva && !hidrato ? (
        <TablePageSkeleton filterCount={3} rows={10} columns={6} />
      ) : (
        <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <DietasComidaTabs
          comidas={COMIDAS_TABS}
          comidaActiva={comidaActiva}
          onComidaChange={cambiarComida}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generarReporte}
            disabled={descargandoReporte || progreso != null}
          >
            <FileText data-icon="inline-start" />
            {descargandoReporte ? "Generando…" : "Generar reporte"}
          </Button>
          <Button type="button" size="sm" onClick={generarEtiquetasSeleccionadas} disabled={progreso != null}>
            <Tag data-icon="inline-start" />
            Generar etiquetas
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Actualizar"
            onClick={() => {
              void sincronizarCenso(comidaActiva)
                .catch(() => undefined)
                .finally(() => {
                  rehidratarDesdeStorage()
                  setUltimaActualizacion(new Date())
                  demoToast(
                    apiActiva
                      ? "Bandejas sincronizadas con el censo."
                      : "Datos sincronizados desde la sesión guardada.",
                  )
                })
            }}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <CocinaKpiGrid
        kpis={kpis}
        kpiActivo={kpiActivo}
        onKpiClick={aplicarFiltroKpi}
      />

      <CocinaFiltrosBar
        filtros={filtros}
        pabellones={opcionesFiltros.pabellones}
        habitaciones={opcionesFiltros.habitaciones}
        tiposDieta={opcionesFiltros.tiposDieta}
        consistencias={opcionesFiltros.consistencias}
        onChange={(next) => {
          setFiltros(next)
          setKpiActivo(undefined)
        }}
        onLimpiar={limpiarFiltros}
      />

      <CocinaBarraDespacho
        cantidad={seleccionadosVisibles}
        visible={seleccionadosVisibles > 0}
        puedeDespacho={puedeDespachoSeleccion}
        onRegistrarDespacho={ejecutarDespacho}
      />

      <CocinaTabla
        ordenes={paginacionCocina.filasPagina}
        seleccionados={seleccionados}
        paginaActual={paginacionCocina.paginaActual}
        totalPaginas={paginacionCocina.totalPaginas}
        paginaDesde={paginacionCocina.paginaDesde}
        paginaHasta={paginacionCocina.paginaHasta}
        totalRegistros={paginacionCocina.total}
        onCambiarPagina={paginacionCocina.setPaginaActual}
        onToggleFila={toggleOrden}
        onToggleTodas={toggleTodas}
        onAbrirDetalle={abrirDetalle}
        getEtiquetaByOrdenId={getEtiquetaByOrdenId}
      />

      <CocinaDetalleSheet
        open={detalleAbierto}
        onOpenChange={setDetalleAbierto}
        orden={ordenDetalleActual}
        onMarcarComoLista={(id) => {
          const orden = ordenes.find((o) => o.id === id)
          if (!orden || !puedeMarcarLista(orden)) {
            demoToast(
              orden
                ? motivoNoMarcarLista(orden) ??
                    "Completa el checklist obligatorio antes de marcar como lista."
                : "No se pudo marcar la bandeja como lista.",
            )
            return
          }
          marcarComoLista([id])
        }}
        onRegistrarDespacho={(id) => {
          const orden = ordenes.find((o) => o.id === id)
          if (!orden || !puedeDespachar(orden, getEtiquetaByOrdenId(id))) {
            demoToast("La bandeja debe estar lista con etiqueta impresa.")
            return
          }
          registrarDespacho([id])
        }}
        onContinuarPreparacion={(id) => marcarEnPreparacion([id])}
        onImprimirEtiqueta={imprimirEtiqueta}
        onChecklistChange={actualizarChecklist}
        onSincronizarChecklist={sincronizarChecklistOrden}
        getEtiquetaByOrdenId={getEtiquetaByOrdenId}
      />
      <EtiquetasProgresoDialog
        open={progreso != null}
        titulo={progreso?.titulo ?? "Procesando…"}
        descripcion={progreso?.descripcion}
      />
        </>
      )}
    </div>
  )
}
