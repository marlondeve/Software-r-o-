import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { useMemo, useState, useEffect } from "react"
import { FileText, Loader2, RefreshCw, Tag } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { CocinaBarraSeleccion } from "@/modules/dietas-cocina/cocina/components/CocinaBarraSeleccion"
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
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { DietasComidaTabs } from "@/modules/dietas-cocina/dietas/components/DietasComidaTabs"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { generarPdfEtiquetas } from "@/modules/dietas-cocina/etiquetas/lib/generarPdfEtiquetas"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import {
  demoToast,
  descargarArchivoDemo,
} from "@/modules/dietas-cocina/lib/demoFeedback"
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
    getEtiquetaByOrdenId,
  } = useCicloBandejas()

  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(() =>
    apiActiva ? obtenerComidaActivaOperativa() : data.comidaActiva,
  )
  const [filtros, setFiltros] = useState<FiltrosCocina>(FILTROS_INICIALES)
  const [kpiActivo, setKpiActivo] = useState<string | undefined>()
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenCocina | null>(null)
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(() => new Date())

  useEffect(() => {
    setUltimaActualizacion(new Date())
  }, [ordenes])

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(
      (orden) =>
        orden.comida === comidaActiva &&
        ordenCoincideFiltros(orden, filtros, getEtiquetaByOrdenId),
    )
  }, [ordenes, comidaActiva, filtros, getEtiquetaByOrdenId])

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
        estadosCocina: data.estadosCocina,
      }
    }
    return {
      pabellones: opcionesConTodos(ordenes.map((o) => o.pabellon), "Todos"),
      habitaciones: opcionesConTodos(ordenes.map((o) => o.habitacion), "Todas"),
      tiposDieta: opcionesConTodos(ordenes.map((o) => o.tipoDieta), "Todos"),
      consistencias: opcionesConTodos(ordenes.map((o) => o.consistencia), "Todas"),
      estadosCocina: data.estadosCocina,
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

  const ordenesSeleccionadas = useMemo(
    () => ordenes.filter((o) => idsSeleccionados().includes(o.id)),
    [ordenes, seleccionados, idsVisibles],
  )

  const barraAcciones = useMemo(() => {
    const puedePrep = ordenesSeleccionadas.some(
      (o) =>
        o.estadoCocina === "por_iniciar" || o.estadoCocina === "en_preparacion",
    )
    const puedeLista = ordenesSeleccionadas.some((o) => puedeMarcarLista(o))
    const puedeDesp = ordenesSeleccionadas.some((o) =>
      puedeDespachar(o, getEtiquetaByOrdenId(o.id)),
    )
    return { puedePrep, puedeLista, puedeDesp }
  }, [ordenesSeleccionadas, getEtiquetaByOrdenId])

  function ejecutarMarcarLista() {
    const ids = idsSeleccionados().filter((id) => {
      const orden = ordenes.find((o) => o.id === id)
      return orden && puedeMarcarLista(orden)
    })
    if (ids.length === 0) {
      const primera = ordenes.find((o) => idsSeleccionados().includes(o.id))
      demoToast(
        primera
          ? motivoNoMarcarLista(primera) ??
              "Completa el checklist obligatorio antes de marcar como lista."
          : "Selecciona bandejas en preparación con checklist completo.",
      )
      return
    }
    marcarComoLista(ids)
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
    const ids = idsSeleccionados().filter((id) => {
      const orden = ordenes.find((o) => o.id === id)
      return orden && puedeGenerarEtiqueta(orden, getEtiquetaByOrdenId(id))
    })

    if (ids.length === 0) {
      demoToast(
        "Selecciona bandejas en estado lista, con checklist obligatorio completo y sin etiqueta generada.",
      )
      return
    }

    void generarEtiquetas(ids)
      .then((etiquetaIds) => {
        if (etiquetaIds.length === 0) {
          demoToast("No se generaron etiquetas para las bandejas seleccionadas.", "error")
          return
        }
        navigate("/dietas-cocina/etiquetas", {
          state: { preseleccion: etiquetaIds },
        })
      })
      .catch((error) => {
        demoToast(
          error instanceof Error
            ? error.message
            : "No se pudieron generar las etiquetas.",
          "error",
        )
      })
  }

  async function imprimirEtiqueta(orden: OrdenCocina) {
    const etiqueta = getEtiquetaByOrdenId(orden.id)
    const etiquetaId = orden.etiquetaId ?? etiqueta?.id

    if (etiqueta) {
      try {
        const fecha = new Date().toISOString().slice(0, 10)
        await generarPdfEtiquetas(
          [etiqueta],
          `etiquetas-${orden.comida}-${fecha}.pdf`,
        )
        marcarEtiquetasImpresas([etiqueta.id])
        demoToast("Etiqueta impresa. Ya puedes registrar el despacho.", "success")
      } catch (error) {
        demoToast(
          error instanceof Error
            ? error.message
            : "No se pudo generar el PDF de la etiqueta.",
          "error",
        )
      }
      return
    }

    if (etiquetaId) {
      navigate("/dietas-cocina/etiquetas", {
        state: { preseleccion: [etiquetaId] },
      })
      return
    }

    void generarEtiquetas([orden.id])
      .then((ids) => {
        if (ids.length === 0) {
          demoToast("No se pudo generar la etiqueta para esta bandeja.", "error")
          return
        }
        navigate("/dietas-cocina/etiquetas", {
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
  }

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Preparación de dietas"
        subtitle={`${formatearFechaOperativa(ultimaActualizacion)} · Actualizado ${formatearHoraActualizacion(ultimaActualizacion)}`}
      />

      {apiActiva && !hidrato ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando bandejas desde el API…
        </div>
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
            onClick={() =>
              descargarArchivoDemo(
                "Reporte cocina demo\n",
                `reporte-cocina-${comidaActiva}.txt`,
              )
            }
          >
            <FileText data-icon="inline-start" />
            Generar reporte
          </Button>
          <Button type="button" size="sm" onClick={generarEtiquetasSeleccionadas}>
            <Tag data-icon="inline-start" />
            Generar etiquetas
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Actualizar"
            onClick={() => {
              rehidratarDesdeStorage()
              setUltimaActualizacion(new Date())
              demoToast(
                apiActiva
                  ? "Bandejas sincronizadas con el censo."
                  : "Datos sincronizados desde la sesión guardada.",
              )
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
        estadosCocina={opcionesFiltros.estadosCocina}
        onChange={(next) => {
          setFiltros(next)
          setKpiActivo(undefined)
        }}
        onLimpiar={limpiarFiltros}
      />

      <CocinaBarraSeleccion
        cantidad={seleccionadosVisibles}
        visible={seleccionadosVisibles > 0}
        puedePreparacion={barraAcciones.puedePrep}
        puedeLista={barraAcciones.puedeLista}
        puedeDespacho={barraAcciones.puedeDesp}
        onMarcarEnPreparacion={() => marcarEnPreparacion(idsSeleccionados())}
        onMarcarComoLista={ejecutarMarcarLista}
        onRegistrarDespacho={ejecutarDespacho}
      />

      <CocinaTabla
        ordenes={ordenesFiltradas}
        seleccionados={seleccionados}
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
        getEtiquetaByOrdenId={getEtiquetaByOrdenId}
      />
        </>
      )}
    </div>
  )
}
