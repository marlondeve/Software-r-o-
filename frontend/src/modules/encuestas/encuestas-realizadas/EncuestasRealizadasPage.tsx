import { useMemo, useState } from "react"

import { AnularEncuestaDialog } from "@/modules/encuestas/encuestas-realizadas/components/AnularEncuestaDialog"
import { DetalleEncuestaSheet } from "@/modules/encuestas/encuestas-realizadas/components/DetalleEncuestaSheet"
import { EncuestasRealizadasTabla } from "@/modules/encuestas/encuestas-realizadas/components/EncuestasRealizadasTabla"
import { EncuestasRealizadasToolbar } from "@/modules/encuestas/encuestas-realizadas/components/EncuestasRealizadasToolbar"
import { FiltrosAvanzados } from "@/modules/encuestas/encuestas-realizadas/components/FiltrosAvanzados"
import type { FiltrosAvanzadosState } from "@/modules/encuestas/encuestas-realizadas/components/FiltrosAvanzados"
import { mockEncuestasRealizadas } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"
import type { FilaEncuestaRealizada } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"

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

const REGISTROS_POR_PAGINA = 3

export function EncuestasRealizadasPage() {
  const data = mockEncuestasRealizadas
  const [filas, setFilas] = useState<FilaEncuestaRealizada[]>(data.filas)
  const [rango, setRango] = useState<{ from?: string; to?: string }>(
    data.rangoFechas,
  )
  const [canal, setCanal] = useState("todos")
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [paginaActual, setPaginaActual] = useState(1)
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

  const totalPaginas = Math.max(1, Math.ceil(data.totalRegistros / REGISTROS_POR_PAGINA))

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
    setPaginaActual(1)
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
        filas={filasFiltradas}
        desde={filasFiltradas.length === 0 ? 0 : 1}
        hasta={filasFiltradas.length}
        totalRegistros={data.totalRegistros}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onCambiarPagina={setPaginaActual}
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
