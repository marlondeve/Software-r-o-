import { useMemo, useState } from "react"
import { Bookmark, CalendarDays, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { AuditoriaDetalleSheet } from "@/modules/dietas-cocina/auditoria/components/AuditoriaDetalleSheet"
import { AuditoriaFiltros } from "@/modules/dietas-cocina/auditoria/components/AuditoriaFiltros"
import { AuditoriaTabla } from "@/modules/dietas-cocina/auditoria/components/AuditoriaTabla"
import { mockAuditoria } from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"
import { obtenerDetalleAuditoria } from "@/modules/dietas-cocina/auditoria/lib/detalleAuditoria"

export function AuditoriaPage() {
  const data = mockAuditoria
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [modulo, setModulo] = useState("todos")
  const [accion, setAccion] = useState("todas")
  const [rol, setRol] = useState("todos")
  const [resultado, setResultado] = useState("todos")

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

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Auditoría y trazabilidad"
        subtitle="Registro forense de actividad del sistema y modificaciones clínicas."
        actions={
          <>
            <Button variant="outline" size="sm">
              <CalendarDays data-icon="inline-start" />
              {data.periodo}
            </Button>
            <Button variant="outline" size="sm">
              <Bookmark data-icon="inline-start" />
              Filtros guardados
            </Button>
            <Button size="sm">
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
        filas={filasFiltradas}
        paginaDesde={data.pagina.desde}
        paginaHasta={Math.min(
          data.pagina.hasta,
          filasFiltradas.length || data.pagina.hasta,
        )}
        total={data.total}
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
