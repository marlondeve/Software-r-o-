import { useEffect, useMemo, useState } from "react"
import { Bookmark, CalendarDays, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { AuditoriaDetalleSheet } from "@/modules/dietas-cocina/auditoria/components/AuditoriaDetalleSheet"
import { AuditoriaFiltros } from "@/modules/dietas-cocina/auditoria/components/AuditoriaFiltros"
import { AuditoriaTabla } from "@/modules/dietas-cocina/auditoria/components/AuditoriaTabla"
import { mockAuditoria } from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"
import { obtenerDetalleAuditoria } from "@/modules/dietas-cocina/auditoria/lib/detalleAuditoria"
import {
  exportarAuditoriaCsv,
  TAMANO_PAGINA_AUDITORIA,
} from "@/modules/dietas-cocina/auditoria/lib/exportarAuditoriaCsv"
import {
  demoToast,
  descargarArchivoDemo,
} from "@/modules/dietas-cocina/lib/demoFeedback"

export function AuditoriaPage() {
  const data = mockAuditoria
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [modulo, setModulo] = useState("todos")
  const [accion, setAccion] = useState("todas")
  const [rol, setRol] = useState("todos")
  const [resultado, setResultado] = useState("todos")
  const [paginaActual, setPaginaActual] = useState(1)

  const filasFiltradas = useMemo(() => {
    return data.filas.filter((fila) => {
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
  }, [data.filas, busqueda, modulo, accion, rol, resultado])

  const totalFiltradas = filasFiltradas.length
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalFiltradas / TAMANO_PAGINA_AUDITORIA),
  )

  const filasPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * TAMANO_PAGINA_AUDITORIA
    return filasFiltradas.slice(inicio, inicio + TAMANO_PAGINA_AUDITORIA)
  }, [filasFiltradas, paginaActual])

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

  const detalle = filaSeleccionada
    ? obtenerDetalleAuditoria(
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
    demoToast(`Exportados ${filasFiltradas.length} registros filtrados (demo).`)
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
              onClick={() => demoToast(`Periodo: ${data.periodo} (demo).`)}
            >
              <CalendarDays data-icon="inline-start" />
              {data.periodo}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => demoToast("Filtros guardados (demo).")}
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

      <AuditoriaDetalleSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        detalle={detalle}
      />
    </div>
  )
}
