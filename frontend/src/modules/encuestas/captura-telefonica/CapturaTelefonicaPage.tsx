import { useMemo, useState } from "react"
import { CalendarDays, RefreshCw } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { CapturaTelefonicaFiltros } from "@/modules/encuestas/captura-telefonica/components/CapturaTelefonicaFiltros"
import type { CapturaTelefonicaFiltrosState } from "@/modules/encuestas/captura-telefonica/components/CapturaTelefonicaFiltros"
import { CapturaTelefonicaKpiGrid } from "@/modules/encuestas/captura-telefonica/components/CapturaTelefonicaKpiGrid"
import { CapturaTelefonicaTabla } from "@/modules/encuestas/captura-telefonica/components/CapturaTelefonicaTabla"
import { GestionLlamadaSheet } from "@/modules/encuestas/captura-telefonica/components/GestionLlamadaSheet"
import type { IntentoGuardado } from "@/modules/encuestas/captura-telefonica/components/GestionLlamadaSheet"
import {
  RESULTADOS_LLAMADA,
  mockCapturaTelefonica,
} from "@/modules/encuestas/captura-telefonica/datos/mockCapturaTelefonica"
import type { FilaCapturaTelefonica } from "@/modules/encuestas/captura-telefonica/datos/mockCapturaTelefonica"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

const FILTROS_INICIALES: CapturaTelefonicaFiltrosState = {
  busqueda: "",
  puntoAtencion: "todos",
  servicio: "todos",
  estado: "todos",
  fechaCita: "",
}

export function CapturaTelefonicaPage() {
  const navigate = useNavigate()
  const data = mockCapturaTelefonica
  const [filas, setFilas] = useState<FilaCapturaTelefonica[]>(data.filas)
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [filaSeleccionada, setFilaSeleccionada] = useState<FilaCapturaTelefonica | null>(
    null,
  )
  const [sheetAbierto, setSheetAbierto] = useState(false)

  const filasFiltradas = useMemo(() => {
    return filas.filter((fila) => {
      if (filtros.busqueda) {
        const texto = filtros.busqueda.toLowerCase()
        const coincide =
          fila.paciente.toLowerCase().includes(texto) ||
          fila.documento.toLowerCase().includes(texto) ||
          fila.telefono.includes(texto)
        if (!coincide) return false
      }
      if (
        filtros.puntoAtencion !== "todos" &&
        filtros.puntoAtencion !== fila.puntoAtencion
      ) {
        return false
      }
      if (filtros.servicio !== "todos" && fila.servicio !== filtros.servicio) {
        return false
      }
      if (filtros.estado !== "todos" && fila.estado !== filtros.estado) {
        return false
      }
      if (filtros.fechaCita && fila.fechaCita !== filtros.fechaCita) {
        return false
      }
      return true
    })
  }, [filas, filtros])

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
  }

  function abrirGestionLlamada(fila: FilaCapturaTelefonica) {
    setFilaSeleccionada(fila)
    setSheetAbierto(true)
  }

  function guardarIntento(fila: FilaCapturaTelefonica, intento: IntentoGuardado) {
    const label =
      RESULTADOS_LLAMADA.find((item) => item.id === intento.resultado)?.label ??
      intento.resultado

    const nuevoEstado =
      intento.resultado === "acepta_encuesta"
        ? "completada"
        : intento.resultado === "solicita_posterior"
          ? "reintento"
          : intento.resultado === "rechaza_participar"
            ? "rechazo"
            : "no_contesta"

    setFilas((prev) =>
      prev.map((item) =>
        item.id === fila.id
          ? {
              ...item,
              estado: nuevoEstado,
              intentos: item.intentos + 1,
              ultimoIntento: "Justo ahora",
              horaReintento:
                intento.resultado === "solicita_posterior"
                  ? intento.horaReintento
                  : undefined,
              historialIntentos: [
                {
                  resultado: label,
                  fecha: "Justo ahora",
                  gestor: "Tú",
                  nota: intento.observaciones,
                },
                ...item.historialIntentos,
              ],
            }
          : item,
      ),
    )
  }

  function iniciarEncuesta(fila: FilaCapturaTelefonica) {
    setSheetAbierto(false)
    setFilas((prev) =>
      prev.map((item) =>
        item.id === fila.id
          ? {
              ...item,
              estado: "completada",
              intentos: item.intentos + 1,
              ultimoIntento: "Justo ahora",
              historialIntentos: [
                {
                  resultado: "Contestó y acepta realizar encuesta",
                  fecha: "Justo ahora",
                  gestor: "Tú",
                },
                ...item.historialIntentos,
              ],
            }
          : item,
      ),
    )
    navigate("/encuestas/captura-encuesta", {
      state: {
        paciente: {
          nombre: fila.paciente,
          documento: fila.documento,
          eps: fila.eps,
          servicio: fila.especialidad,
          canal: "telefonica",
        },
      },
    })
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Captura telefónica"
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {data.rangoFechas}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="size-3.5" />
              Última sinc. {data.ultimaSincronizacion}
            </span>
          </span>
        }
        actions={
          <Button type="button" variant="outline" className="h-11 text-sm">
            <RefreshCw data-icon="inline-start" />
            Actualizar listado
          </Button>
        }
      />

      <CapturaTelefonicaKpiGrid kpis={data.kpis} />

      <CapturaTelefonicaFiltros
        filtros={filtros}
        onChange={setFiltros}
        onLimpiar={limpiarFiltros}
      />

      <CapturaTelefonicaTabla filas={filasFiltradas} onLlamar={abrirGestionLlamada} />

      <GestionLlamadaSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        fila={filaSeleccionada}
        onGuardarIntento={guardarIntento}
        onIniciarEncuesta={iniciarEncuesta}
      />
    </div>
  )
}
