import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { CuestionariosFiltros } from "@/modules/encuestas/cuestionarios/components/CuestionariosFiltros"
import type { CuestionariosFiltrosState } from "@/modules/encuestas/cuestionarios/components/CuestionariosFiltros"
import { CuestionariosTabla } from "@/modules/encuestas/cuestionarios/components/CuestionariosTabla"
import { mockCuestionarios } from "@/modules/encuestas/cuestionarios/datos/mockCuestionarios"
import type { Cuestionario } from "@/modules/encuestas/cuestionarios/datos/mockCuestionarios"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

const FILTROS_INICIALES: CuestionariosFiltrosState = {
  busqueda: "",
  canal: "todos",
  estado: "todos",
}

export function CuestionariosPage() {
  const navigate = useNavigate()
  const [cuestionarios, setCuestionarios] = useState(mockCuestionarios)
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)

  const cuestionariosFiltrados = useMemo(() => {
    return cuestionarios.filter((cuestionario) => {
      if (
        filtros.busqueda &&
        !cuestionario.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase())
      ) {
        return false
      }
      if (filtros.canal !== "todos" && cuestionario.canal !== filtros.canal) {
        return false
      }
      if (filtros.estado !== "todos" && cuestionario.estado !== filtros.estado) {
        return false
      }
      return true
    })
  }, [cuestionarios, filtros])

  function editar(cuestionario: Cuestionario) {
    navigate(`/encuestas/cuestionarios/${cuestionario.id}/editor`)
  }

  function verPreguntas(cuestionario: Cuestionario) {
    window.alert(`Ver preguntas de: ${cuestionario.nombre}`)
  }

  function duplicar(cuestionario: Cuestionario) {
    setCuestionarios((prev) => [
      ...prev,
      {
        ...cuestionario,
        id: crypto.randomUUID(),
        nombre: `${cuestionario.nombre} (copia)`,
        estado: "borrador",
      },
    ])
  }

  function toggleEstado(cuestionario: Cuestionario) {
    setCuestionarios((prev) =>
      prev.map((item) =>
        item.id === cuestionario.id
          ? { ...item, estado: item.estado === "inactivo" ? "activo" : "inactivo" }
          : item,
      ),
    )
  }

  function eliminar(cuestionario: Cuestionario) {
    setCuestionarios((prev) => prev.filter((item) => item.id !== cuestionario.id))
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Cuestionarios"
        subtitle="Administra las plantillas de encuesta disponibles para captura presencial y telefónica."
        actions={
          <Button
            type="button"
            onClick={() => navigate("/encuestas/cuestionarios/nuevo/editor")}
          >
            <Plus data-icon="inline-start" />
            Nuevo cuestionario
          </Button>
        }
      />

      <CuestionariosFiltros filtros={filtros} onChange={setFiltros} />

      <CuestionariosTabla
        cuestionarios={cuestionariosFiltrados}
        onEditar={editar}
        onVerPreguntas={verPreguntas}
        onDuplicar={duplicar}
        onToggleEstado={toggleEstado}
        onEliminar={eliminar}
      />
    </div>
  )
}
