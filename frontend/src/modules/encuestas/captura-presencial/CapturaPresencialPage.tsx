import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { CapturaPresencialFiltros } from "@/modules/encuestas/captura-presencial/components/CapturaPresencialFiltros"
import type { CapturaPresencialFiltrosState } from "@/modules/encuestas/captura-presencial/components/CapturaPresencialFiltros"
import { CapturaPresencialKpiGrid } from "@/modules/encuestas/captura-presencial/components/CapturaPresencialKpiGrid"
import { PacienteCard } from "@/modules/encuestas/captura-presencial/components/PacienteCard"
import { mockCapturaPresencial } from "@/modules/encuestas/captura-presencial/datos/mockCapturaPresencial"
import type { PacientePresencial } from "@/modules/encuestas/captura-presencial/datos/mockCapturaPresencial"

const FILTROS_INICIALES: CapturaPresencialFiltrosState = {
  busqueda: "",
  servicio: "todos",
  pabellon: "todos",
  estado: "todos",
  soloPendientes: false,
}

export function CapturaPresencialPage() {
  const navigate = useNavigate()
  const data = mockCapturaPresencial
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)

  const pacientesFiltrados = useMemo(() => {
    return data.pacientes.filter((paciente) => {
      if (filtros.busqueda) {
        const texto = filtros.busqueda.toLowerCase()
        const coincide =
          paciente.nombre.toLowerCase().includes(texto) ||
          paciente.documento.includes(texto)
        if (!coincide) return false
      }
      if (filtros.servicio !== "todos" && paciente.servicio !== filtros.servicio) {
        return false
      }
      if (filtros.estado !== "todos" && paciente.estado !== filtros.estado) {
        return false
      }
      if (filtros.soloPendientes && paciente.estado !== "pendiente") {
        return false
      }
      return true
    })
  }, [data.pacientes, filtros])

  function ejecutarAccion(etiqueta: string, paciente: PacientePresencial) {
    window.alert(`${etiqueta}: ${paciente.nombre}`)
  }

  function irACapturaEncuesta(paciente: PacientePresencial, seccionInicial: number) {
    navigate("/encuestas/captura-encuesta", {
      state: {
        paciente: {
          nombre: paciente.nombre,
          documento: `CC ${paciente.documento}`,
          eps: paciente.aseguradora ?? "Particular",
          servicio: paciente.servicio,
          canal: "presencial",
        },
        seccionInicial,
      },
    })
  }

  return (
    <div className="space-y-5">
      <CapturaPresencialKpiGrid kpis={data.kpis} />

      <CapturaPresencialFiltros filtros={filtros} onChange={setFiltros} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {pacientesFiltrados.map((paciente) => (
          <PacienteCard
            key={paciente.id}
            paciente={paciente}
            onIniciar={(p) => irACapturaEncuesta(p, 0)}
            onContinuar={(p) => irACapturaEncuesta(p, 1)}
            onVer={(p) => ejecutarAccion("Ver encuesta", p)}
            onMarcarNoDisponible={(p) => ejecutarAccion("Marcar no disponible", p)}
            onRechazar={(p) => ejecutarAccion("Rechazar", p)}
            onReintentar={(p) => ejecutarAccion("Reintentar", p)}
          />
        ))}
        {pacientesFiltrados.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No hay pacientes que coincidan con los filtros.
          </p>
        )}
      </div>
    </div>
  )
}
