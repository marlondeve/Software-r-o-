import { useMemo, useState } from "react"

import { AnularEncuestaDialog } from "@/modules/encuestas/encuestas-realizadas/components/AnularEncuestaDialog"
import { DetalleEncuestaSheet } from "@/modules/encuestas/encuestas-realizadas/components/DetalleEncuestaSheet"
import { EncuestasRealizadasTabla } from "@/modules/encuestas/encuestas-realizadas/components/EncuestasRealizadasTabla"
import { EncuestasRealizadasToolbar } from "@/modules/encuestas/encuestas-realizadas/components/EncuestasRealizadasToolbar"
import { FiltrosAvanzados } from "@/modules/encuestas/encuestas-realizadas/components/FiltrosAvanzados"
import type { FiltrosAvanzadosState } from "@/modules/encuestas/encuestas-realizadas/components/FiltrosAvanzados"
import { mockEncuestasRealizadas } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"
import type { FilaEncuestaRealizada } from "@/modules/encuestas/types/completed-surveys"
import { usePaginacionTabla } from "@/lib/usePaginacionTabla"

const FILTROS_INICIALES: FiltrosAvanzadosState = {
  consecutivo: "",
  paciente: "",
  entidad: "todos",
  servicio: "todos",
  puntoAtencion: "todos",
  encuestador: "todos",
  estado: "todos",
  satRec: "cualquiera",
  soloRespuestaNegativa: false,
}

export function EncuestasRealizadasPage() {
  const data = mockEncuestasRealizadas
  const [filas, setFilas] = useState<FilaEncuestaRealizada[]>(data.filas)
  const [rango, setRango] = useState<{ from?: string; to?: string }>(
    data.rangoFechas,
  )
  const [canal, setCanal] = useState("todos")
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [filaParaAnular, setFilaParaAnular] = useState<FilaEncuestaRealizada | null>(
    null,
  )
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [filaParaVer, setFilaParaVer] = useState<FilaEncuestaRealizada | null>(null)
  const [sheetAbierto, setSheetAbierto] = useState(false)

  const filasFiltradas = useMemo(() => {
    return filas.filter((fila) => {
      if (canal !== "todos" && fila.canal !== canal) return false
      if (
        filtros.consecutivo &&
        !fila.consecutivo.toLowerCase().includes(filtros.consecutivo.toLowerCase())
      ) {
        return false
      }
      if (
        filtros.paciente &&
        !fila.paciente.toLowerCase().includes(filtros.paciente.toLowerCase())
      ) {
        return false
      }
      if (filtros.entidad !== "todos" && fila.entidad !== filtros.entidad) return false
      if (filtros.servicio !== "todos" && fila.servicio !== filtros.servicio) return false
      if (
        filtros.puntoAtencion !== "todos" &&
        fila.puntoAtencion !== filtros.puntoAtencion
      ) {
        return false
      }
      if (filtros.estado !== "todos" && fila.estado !== filtros.estado) {
        return false
      }
      if (filtros.soloRespuestaNegativa && !fila.comentarioNegativo) return false
      return true
    })
  }, [filas, canal, filtros])

  const paginacion = usePaginacionTabla(filasFiltradas, {
    resetKey: `${canal}-${JSON.stringify(filtros)}`,
  })

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
    paginacion.setPaginaActual(1)
  }

  function ver(fila: FilaEncuestaRealizada) {
    setFilaParaVer(fila)
    setSheetAbierto(true)
  }

  function descartar(fila: FilaEncuestaRealizada) {
    setFilaParaAnular(fila)
    setDialogAbierto(true)
  }

  function anularDesdeSheet(fila: FilaEncuestaRealizada) {
    setSheetAbierto(false)
    descartar(fila)
  }

  function confirmarAnulacion(fila: FilaEncuestaRealizada, motivo: string) {
    setFilas((prev) =>
      prev.map((item) =>
        item.id === fila.id
          ? { ...item, estado: "anulada", motivoAnulacion: motivo, comentarioNegativo: false }
          : item,
      ),
    )
  }

  return (
    <div className="space-y-5">
      <div className="border-b border-border">
        <EncuestasRealizadasToolbar
          rango={rango}
          onRangoChange={setRango}
          canal={canal}
          onCanalChange={setCanal}
        />
      </div>

      <FiltrosAvanzados
        filtros={filtros}
        onChange={setFiltros}
        onLimpiar={limpiarFiltros}
      />

      <EncuestasRealizadasTabla
        filas={paginacion.filasPagina}
        desde={paginacion.paginaDesde}
        hasta={paginacion.paginaHasta}
        totalRegistros={paginacion.total}
        paginaActual={paginacion.paginaActual}
        totalPaginas={paginacion.totalPaginas}
        onCambiarPagina={paginacion.setPaginaActual}
        onVer={ver}
        onDescartar={descartar}
      />

      <AnularEncuestaDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        fila={filaParaAnular}
        onConfirmar={confirmarAnulacion}
      />

      <DetalleEncuestaSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        fila={filaParaVer}
        onAnular={anularDesdeSheet}
      />
    </div>
  )
}
