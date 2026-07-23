import { useState } from "react"
import { Search } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { BusquedaPacienteCard } from "@/modules/encuestas/identificacion-paciente/components/BusquedaPacienteCard"
import type { BusquedaPacienteState } from "@/modules/encuestas/identificacion-paciente/components/BusquedaPacienteCard"
import { PacienteEncontradoCard } from "@/modules/encuestas/identificacion-paciente/components/PacienteEncontradoCard"
import {
  TIPOS_DOCUMENTO,
  mockPacienteEncontrado,
} from "@/modules/encuestas/identificacion-paciente/datos/mockIdentificacionPaciente"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

const BUSQUEDA_INICIAL: BusquedaPacienteState = {
  tipoDocumento: TIPOS_DOCUMENTO[0],
  numeroDocumento: "",
}

export function IdentificacionPacientePage() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState(BUSQUEDA_INICIAL)
  const [buscando, setBuscando] = useState(false)
  const [pacienteEncontrado, setPacienteEncontrado] = useState<
    typeof mockPacienteEncontrado | null
  >(null)

  function buscarPaciente() {
    setBuscando(true)
    setPacienteEncontrado(null)
    window.setTimeout(() => {
      setPacienteEncontrado(mockPacienteEncontrado)
      setBuscando(false)
    }, 400)
  }

  function reportarInconsistencia() {
    window.alert("Reportando inconsistencia de datos con Hosvital/SISMA...")
  }

  function iniciarEncuesta() {
    if (!pacienteEncontrado) return
    navigate("/encuestas/captura-encuesta", {
      state: {
        paciente: {
          nombre: pacienteEncontrado.nombre,
          documento: pacienteEncontrado.documento,
          eps: pacienteEncontrado.entidadEps,
          contrato: pacienteEncontrado.contrato,
          servicio: pacienteEncontrado.servicio,
          canal: pacienteEncontrado.canal,
        },
      },
    })
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Identificación de Paciente"
        subtitle="Ingrese los datos del paciente para precargar la información de atención desde Hosvital/SISMA."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
        <BusquedaPacienteCard
          busqueda={busqueda}
          onChange={setBusqueda}
          onBuscar={buscarPaciente}
          buscando={buscando}
        />

        {pacienteEncontrado ? (
          <PacienteEncontradoCard
            paciente={pacienteEncontrado}
            onReportarInconsistencia={reportarInconsistencia}
            onIniciarEncuesta={iniciarEncuesta}
          />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
            <Search className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {buscando
                ? "Buscando paciente en Hosvital/SISMA..."
                : "Busca un paciente para ver su información de atención."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
