import { useMemo, useState } from "react"
import { Copy, Trash2 } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfiguracionLogicaPanel } from "@/modules/encuestas/editor-cuestionario/components/ConfiguracionLogicaPanel"
import { EstructuraPanel } from "@/modules/encuestas/editor-cuestionario/components/EstructuraPanel"
import { PreguntaEditorPanel } from "@/modules/encuestas/editor-cuestionario/components/PreguntaEditorPanel"
import {
  mockEditorCuestionario,
  type PreguntaEditor,
  type SeccionEditor,
} from "@/modules/encuestas/editor-cuestionario/datos/mockEditorCuestionario"
import { mockCuestionarios } from "@/modules/encuestas/cuestionarios/datos/mockCuestionarios"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

function crearSeccionVacia(numero: number): SeccionEditor {
  return {
    id: crypto.randomUUID(),
    titulo: `${numero}. Nueva sección`,
    preguntas: [],
  }
}

export function EditorCuestionarioPage() {
  const { cuestionarioId } = useParams()
  const navigate = useNavigate()

  const esNuevo = cuestionarioId === "nuevo"
  const cuestionario = mockCuestionarios.find((item) => item.id === cuestionarioId)

  const [nombreCuestionario, setNombreCuestionario] = useState(
    esNuevo ? "" : (cuestionario?.nombre ?? mockEditorCuestionario.nombre),
  )
  const [secciones, setSecciones] = useState<SeccionEditor[]>(() =>
    esNuevo ? [crearSeccionVacia(1)] : mockEditorCuestionario.secciones,
  )
  const [seccionesExpandidas, setSeccionesExpandidas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(secciones.map((seccion, index) => [seccion.id, index === 0])),
  )
  const [preguntaSeleccionadaId, setPreguntaSeleccionadaId] = useState<string | null>(
    secciones[0]?.preguntas[0]?.id ?? null,
  )

  const preguntaSeleccionada = useMemo(
    () =>
      secciones
        .flatMap((seccion) => seccion.preguntas)
        .find((pregunta) => pregunta.id === preguntaSeleccionadaId) ?? null,
    [secciones, preguntaSeleccionadaId],
  )

  function actualizarPregunta(preguntaId: string, patch: Partial<PreguntaEditor>) {
    setSecciones((prev) =>
      prev.map((seccion) => ({
        ...seccion,
        preguntas: seccion.preguntas.map((pregunta) =>
          pregunta.id === preguntaId ? { ...pregunta, ...patch } : pregunta,
        ),
      })),
    )
  }

  function cambiarCampoPregunta<K extends keyof PreguntaEditor>(
    campo: K,
    valor: PreguntaEditor[K],
  ) {
    if (!preguntaSeleccionada) return
    actualizarPregunta(preguntaSeleccionada.id, { [campo]: valor } as Partial<PreguntaEditor>)
  }

  function cambiarOpcion(opcionId: string, texto: string) {
    if (!preguntaSeleccionada) return
    actualizarPregunta(preguntaSeleccionada.id, {
      opciones: preguntaSeleccionada.opciones.map((opcion) =>
        opcion.id === opcionId ? { ...opcion, texto } : opcion,
      ),
    })
  }

  function toggleOpcionNegativa(opcionId: string) {
    if (!preguntaSeleccionada) return
    actualizarPregunta(preguntaSeleccionada.id, {
      opciones: preguntaSeleccionada.opciones.map((opcion) =>
        opcion.id === opcionId ? { ...opcion, esNegativa: !opcion.esNegativa } : opcion,
      ),
    })
  }

  function anadirOpcion() {
    if (!preguntaSeleccionada) return
    actualizarPregunta(preguntaSeleccionada.id, {
      opciones: [
        ...preguntaSeleccionada.opciones,
        { id: crypto.randomUUID(), texto: "", esNegativa: false },
      ],
    })
  }

  function eliminarCondicion(condicionId: string) {
    if (!preguntaSeleccionada) return
    actualizarPregunta(preguntaSeleccionada.id, {
      logica: {
        ...preguntaSeleccionada.logica,
        condiciones: preguntaSeleccionada.logica.condiciones.filter(
          (condicion) => condicion.id !== condicionId,
        ),
      },
    })
  }

  function anadirCondicion() {
    if (!preguntaSeleccionada) return
    actualizarPregunta(preguntaSeleccionada.id, {
      logica: {
        activa: true,
        condiciones: [
          ...preguntaSeleccionada.logica.condiciones,
          {
            id: crypto.randomUUID(),
            variable: "Respuesta anterior",
            operador: "es",
            valor: "",
          },
        ],
      },
    })
  }

  function toggleSeccion(seccionId: string) {
    setSeccionesExpandidas((prev) => ({ ...prev, [seccionId]: !(prev[seccionId] ?? true) }))
  }

  function anadirSeccion() {
    const nuevaSeccion: SeccionEditor = {
      id: crypto.randomUUID(),
      titulo: `${secciones.length + 1}. Nueva sección`,
      preguntas: [],
    }
    setSecciones((prev) => [...prev, nuevaSeccion])
    setSeccionesExpandidas((prev) => ({ ...prev, [nuevaSeccion.id]: true }))
  }

  function anadirPregunta(seccionId: string) {
    const nuevaPregunta: PreguntaEditor = {
      id: crypto.randomUUID(),
      codigoInterno: "",
      texto: "Nueva pregunta",
      descripcion: "",
      tipoRespuesta: "texto_libre",
      tipoBadgeLabel: "Texto",
      requerida: false,
      habilitada: true,
      opciones: [],
      servicioAplicable: "Urgencias",
      canalCaptura: "presencial",
      logica: { activa: false, condiciones: [] },
      comportamientoAlerta: "Ninguno",
    }
    setSecciones((prev) =>
      prev.map((seccion) =>
        seccion.id === seccionId
          ? { ...seccion, preguntas: [...seccion.preguntas, nuevaPregunta] }
          : seccion,
      ),
    )
    setPreguntaSeleccionadaId(nuevaPregunta.id)
  }

  function duplicarCuestionario() {
    window.alert(`Duplicando cuestionario: ${nombreCuestionario}`)
  }

  function eliminarCuestionario() {
    if (window.confirm(`¿Eliminar el cuestionario "${nombreCuestionario}"?`)) {
      navigate("/encuestas/cuestionarios")
    }
  }

  function guardarCambios() {
    if (esNuevo) {
      window.alert(`Cuestionario "${nombreCuestionario || "Sin nombre"}" creado.`)
      navigate("/encuestas/cuestionarios")
      return
    }
    window.alert("Cambios guardados.")
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title={esNuevo ? "Nuevo Cuestionario" : "Editor Visual de Preguntas"}
        subtitle={
          esNuevo ? (
            <Input
              value={nombreCuestionario}
              onChange={(event) => setNombreCuestionario(event.target.value)}
              placeholder="Nombre del cuestionario"
              className="h-8 w-72"
            />
          ) : (
            nombreCuestionario
          )
        }
        actions={
          <>
            {!esNuevo && (
              <>
                <Button type="button" variant="ghost" onClick={duplicarCuestionario}>
                  <Copy data-icon="inline-start" />
                  Duplicar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={eliminarCuestionario}
                >
                  <Trash2 data-icon="inline-start" />
                  Eliminar
                </Button>
              </>
            )}
            <Button type="button" onClick={guardarCambios}>
              {esNuevo ? "Crear Cuestionario" : "Guardar Cambios"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
        <EstructuraPanel
          secciones={secciones}
          seccionesExpandidas={seccionesExpandidas}
          preguntaSeleccionadaId={preguntaSeleccionadaId}
          onToggleSeccion={toggleSeccion}
          onSeleccionarPregunta={setPreguntaSeleccionadaId}
          onAnadirSeccion={anadirSeccion}
          onAnadirPregunta={anadirPregunta}
        />

        {preguntaSeleccionada ? (
          <>
            <PreguntaEditorPanel
              pregunta={preguntaSeleccionada}
              onCambiar={cambiarCampoPregunta}
              onCambiarOpcion={cambiarOpcion}
              onToggleOpcionNegativa={toggleOpcionNegativa}
              onAnadirOpcion={anadirOpcion}
            />

            <ConfiguracionLogicaPanel
              pregunta={preguntaSeleccionada}
              onCambiar={cambiarCampoPregunta}
              onEliminarCondicion={eliminarCondicion}
              onAnadirCondicion={anadirCondicion}
            />
          </>
        ) : (
          <div className="xl:col-span-2">
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Seleccioná una pregunta en la estructura para editarla.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
