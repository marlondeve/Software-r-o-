import { useEffect, useMemo, useState } from "react"
import { Bookmark, CalendarDays, Download } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { AuditoriaDetalleSheet } from "@/modules/dietas-cocina/auditoria/components/AuditoriaDetalleSheet"
import { AuditoriaFiltros } from "@/modules/dietas-cocina/auditoria/components/AuditoriaFiltros"
import { AuditoriaTabla } from "@/modules/dietas-cocina/auditoria/components/AuditoriaTabla"
import { mockAuditoria } from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"
import { obtenerDetalleAuditoria as obtenerDetalleAuditoriaMock } from "@/modules/dietas-cocina/auditoria/lib/detalleAuditoria"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  listarAuditoria,
  obtenerDetalleAuditoria,
} from "@/modules/dietas-cocina/api/services/auditoria.service"
import type { DetalleAuditoria, FilaAuditoria } from "@/modules/dietas-cocina/types/audit"
import {
  exportarAuditoriaCsv,
  TAMANO_PAGINA_AUDITORIA,
} from "@/modules/dietas-cocina/auditoria/lib/exportarAuditoriaCsv"
import {
  demoToast,
  descargarArchivoDemo,
} from "@/modules/dietas-cocina/lib/demoFeedback"

export function AuditoriaPage() {
  const apiActiva = usarApiDietasCocina()
  const data = mockAuditoria
  const [filasApi, setFilasApi] = useState<FilaAuditoria[]>([])
  const [metaApi, setMetaApi] = useState<{ total: number; totalPages: number } | null>(null)
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [modulo, setModulo] = useState("todos")
  const [accion, setAccion] = useState("todas")
  const [rol, setRol] = useState("todos")
  const [resultado, setResultado] = useState("todos")
  const [paginaActual, setPaginaActual] = useState(1)
  const [detalleApi, setDetalleApi] = useState<DetalleAuditoria | null>(null)
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false)
  const [errorAuditoria, setErrorAuditoria] = useState<string | null>(null)

  useEffect(() => {
    if (!apiActiva) return
    setCargandoAuditoria(true)
    setErrorAuditoria(null)
    void listarAuditoria({
      page: paginaActual,
      pageSize: TAMANO_PAGINA_AUDITORIA,
      modulo: modulo !== "todos" ? modulo : undefined,
      resultado: resultado !== "todos" ? resultado : undefined,
    })
      .then((res) => {
        setFilasApi(res.filas)
        setMetaApi(
          res.meta
            ? {
                total: res.meta.total ?? 0,
                totalPages: res.meta.totalPages ?? 1,
              }
            : null,
        )
      })
      .catch((error) => {
        setFilasApi([])
        setMetaApi(null)
        setErrorAuditoria(
          error instanceof Error ? error.message : "No se pudo cargar la auditoría.",
        )
      })
      .finally(() => setCargandoAuditoria(false))
  }, [apiActiva, paginaActual, modulo, resultado])

  const filasBase = apiActiva ? filasApi : data.filas

  const filasFiltradas = useMemo(() => {
    return filasBase.filter((fila) => {
      const termino = busqueda.trim().toLowerCase()
      const coincideBusqueda =
        !termino ||
        fila.registroId.toLowerCase().includes(termino) ||
        fila.codigoAuditoria.toLowerCase().includes(termino) ||
        fila.usuario.nombre.toLowerCase().includes(termino)

      const coincideModulo = modulo === "todos" || fila.modulo === modulo

      const coincideAccion =
        accion === "todas" ||
        fila.accion.toLowerCase().includes(accion.toLowerCase())

      const coincideRol =
        rol === "todos" ||
        (rol === "Sistema"
          ? fila.usuario.esSistema
          : fila.usuario.rol.includes(rol))

      const coincideResultado =
        resultado === "todos" || fila.resultado === resultado

      return (
        coincideBusqueda &&
        coincideModulo &&
        coincideAccion &&
        coincideRol &&
        coincideResultado
      )
    })
  }, [filasBase, busqueda, modulo, accion, rol, resultado])

  const totalFiltradas = apiActiva && metaApi ? metaApi.total : filasFiltradas.length
  const totalPaginas = apiActiva && metaApi
    ? Math.max(1, metaApi.totalPages)
    : Math.max(1, Math.ceil(filasFiltradas.length / TAMANO_PAGINA_AUDITORIA))

  const filasPagina = useMemo(() => {
    if (apiActiva) return filasFiltradas
    const inicio = (paginaActual - 1) * TAMANO_PAGINA_AUDITORIA
    return filasFiltradas.slice(inicio, inicio + TAMANO_PAGINA_AUDITORIA)
  }, [apiActiva, filasFiltradas, paginaActual])

  const paginaDesde =
    totalFiltradas === 0 ? 0 : (paginaActual - 1) * TAMANO_PAGINA_AUDITORIA + 1
  const paginaHasta = Math.min(
    paginaActual * TAMANO_PAGINA_AUDITORIA,
    totalFiltradas,
  )

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, modulo, accion, rol, resultado])

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas)
    }
  }, [paginaActual, totalPaginas])

  useEffect(() => {
    if (!apiActiva || !filaSeleccionada) {
      setDetalleApi(null)
      return
    }

    let cancelado = false
    void obtenerDetalleAuditoria(filaSeleccionada)
      .then((detalle) => {
        if (!cancelado) setDetalleApi(detalle)
      })
      .catch(() => {
        if (!cancelado) setDetalleApi(null)
      })

    return () => {
      cancelado = true
    }
  }, [apiActiva, filaSeleccionada])

  const detalle = apiActiva
    ? detalleApi
    : filaSeleccionada
      ? obtenerDetalleAuditoriaMock(
          filaSeleccionada,
          data.filas,
          data.detalles,
        )
      : null

  function abrirDetalle(id: string) {
    setFilaSeleccionada(id)
    setSheetAbierto(true)
  }

  function limpiarFiltros() {
    setBusqueda("")
    setModulo("todos")
    setAccion("todas")
    setRol("todos")
    setResultado("todos")
  }

  function exportarCsv() {
    const contenido = exportarAuditoriaCsv(filasFiltradas)
    descargarArchivoDemo(contenido, "auditoria-dietas-cocina.csv", "text/csv")
    demoToast(`Exportados ${filasFiltradas.length} registros filtrados.`)
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Auditoría y trazabilidad"
        subtitle="Registro forense de actividad del sistema y modificaciones clínicas."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => demoToast(`Periodo: ${data.periodo}.`)}
            >
              <CalendarDays data-icon="inline-start" />
              {data.periodo}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => demoToast("Filtros guardados.")}
            >
              <Bookmark data-icon="inline-start" />
              Filtros guardados
            </Button>
            <Button size="sm" onClick={exportarCsv}>
              <Download data-icon="inline-start" />
              Exportar CSV
            </Button>
          </>
        }
      />

      {apiActiva && errorAuditoria && (
        <Alert variant="destructive">
          <AlertDescription>{errorAuditoria}</AlertDescription>
        </Alert>
      )}

      <AuditoriaFiltros
        moduloLabel={data.filtros.modulo}
        accionLabel={data.filtros.accion}
        rolLabel={data.filtros.rol}
        resultadoLabel={data.filtros.resultado}
        busqueda={busqueda}
        modulo={modulo}
        accion={accion}
        rol={rol}
        resultado={resultado}
        onBusquedaChange={setBusqueda}
        onModuloChange={setModulo}
        onAccionChange={setAccion}
        onRolChange={setRol}
        onResultadoChange={setResultado}
        onLimpiar={limpiarFiltros}
      />

      <AuditoriaTabla
        filas={filasPagina}
        paginaDesde={paginaDesde}
        paginaHasta={paginaHasta}
        total={totalFiltradas}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onCambiarPagina={setPaginaActual}
        onVerDetalle={abrirDetalle}
      />

      {apiActiva && cargandoAuditoria && filasPagina.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Cargando registros de auditoría…
        </p>
      )}

      <AuditoriaDetalleSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        detalle={detalle}
      />
    </div>
  )
}
