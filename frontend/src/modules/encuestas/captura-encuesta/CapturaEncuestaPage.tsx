import { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { CapturaEncuestaTopBar } from "@/modules/encuestas/captura-encuesta/components/CapturaEncuestaTopBar"
import { EscalaSatisfaccionInput } from "@/modules/encuestas/captura-encuesta/components/EscalaSatisfaccionInput"
import { MotivoCalificacionPanel } from "@/modules/encuestas/captura-encuesta/components/MotivoCalificacionPanel"
import type { MotivoCalificacion } from "@/modules/encuestas/captura-encuesta/components/MotivoCalificacionPanel"
import { OpcionUnicaInput } from "@/modules/encuestas/captura-encuesta/components/OpcionUnicaInput"
import { ProgresoSeccion } from "@/modules/encuestas/captura-encuesta/components/ProgresoSeccion"
import { RevisionFinalStep } from "@/modules/encuestas/captura-encuesta/components/RevisionFinalStep"
import type { RespuestaResumen } from "@/modules/encuestas/captura-encuesta/components/RevisionFinalStep"
import { SeccionEncuestaCard } from "@/modules/encuestas/captura-encuesta/components/SeccionEncuestaCard"
import { TextoLibreInput } from "@/modules/encuestas/captura-encuesta/components/TextoLibreInput"
import {
  OPCIONES_SATISFACCION,
  PACIENTE_CONTEXTO_DEFECTO,
  SECCIONES_ENCUESTA,
  VALORES_NEGATIVOS,
  type PacienteContextoEncuesta,
  type ValorSatisfaccion,
} from "@/modules/encuestas/captura-encuesta/datos/mockCapturaEncuesta"

interface RespuestaSeccion {
  valor: string | null
  motivo?: MotivoCalificacion
}

const MOTIVO_VACIO: MotivoCalificacion = { chips: [], texto: "" }
const TOTAL_PREGUNTAS = SECCIONES_ENCUESTA.length
const TOTAL_PASOS = TOTAL_PREGUNTAS + 1

function formatearFechaHoraActual() {
  const ahora = new Date()
  const fecha = ahora.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const hora = ahora.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${fecha}, ${hora}`
}

export function CapturaEncuestaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario } = useAuth()
  const estado = location.state as
    | { paciente?: PacienteContextoEncuesta; seccionInicial?: number }
    | null

  const paciente = estado?.paciente ?? PACIENTE_CONTEXTO_DEFECTO
  const encuestador = usuario?.nombre ?? "Encuestador"
  const [seccionIndex, setSeccionIndex] = useState(estado?.seccionInicial ?? 0)
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaSeccion>>({})
  const [fechaHora] = useState(() => formatearFechaHoraActual())

  const esRevisionFinal = seccionIndex === TOTAL_PREGUNTAS
  const seccion = SECCIONES_ENCUESTA[seccionIndex]
  const siguienteSeccion = !esRevisionFinal ? SECCIONES_ENCUESTA[seccionIndex + 1] : undefined
  const respuestaActual = !esRevisionFinal
    ? (respuestas[seccion.id] ?? { valor: null })
    : { valor: null }

  const requiereMotivo =
    !esRevisionFinal &&
    seccion.tipo === "escala_satisfaccion" &&
    VALORES_NEGATIVOS.includes(respuestaActual.valor as ValorSatisfaccion)

  const motivoCompleto = Boolean(
    respuestaActual.motivo &&
      (respuestaActual.motivo.chips.length > 0 ||
        respuestaActual.motivo.texto.trim().length > 0),
  )

  const puedeAvanzar = esRevisionFinal
    ? true
    : seccion.opcional
      ? true
      : Boolean(respuestaActual.valor && (!requiereMotivo || motivoCompleto))

  function actualizarRespuesta(seccionId: string, patch: Partial<RespuestaSeccion>) {
    setRespuestas((prev) => ({
      ...prev,
      [seccionId]: { ...(prev[seccionId] ?? { valor: null }), ...patch },
    }))
  }

  function seleccionarValor(valor: string) {
    if (esRevisionFinal) return
    actualizarRespuesta(seccion.id, {
      valor,
      motivo: VALORES_NEGATIVOS.includes(valor as ValorSatisfaccion)
        ? (respuestaActual.motivo ?? MOTIVO_VACIO)
        : undefined,
    })
  }

  function cambiarMotivo(motivo: MotivoCalificacion) {
    if (esRevisionFinal) return
    actualizarRespuesta(seccion.id, { motivo })
  }

  function anterior() {
    setSeccionIndex((index) => Math.max(0, index - 1))
  }

  function siguiente() {
    if (!puedeAvanzar) return

    if (esRevisionFinal) {
      const consecutivo = `#SIAO-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`
      navigate("/encuestas/captura-encuesta/registrada", {
        state: {
          consecutivo,
          horaRegistro: fechaHora.split(", ")[1] ?? fechaHora,
          encuestador,
        },
      })
      return
    }

    setSeccionIndex((index) => Math.min(TOTAL_PASOS - 1, index + 1))
  }

  function guardarBorrador() {
    window.alert("Borrador guardado.")
  }

  function salir() {
    if (window.confirm("¿Salir de la encuesta? El progreso quedó guardado como borrador.")) {
      navigate(-1)
    }
  }

  function construirResumen(): RespuestaResumen[] {
    return SECCIONES_ENCUESTA.map((item) => {
      const respuesta = respuestas[item.id]
      let etiqueta = "Sin responder"

      if (item.tipo === "escala_satisfaccion") {
        etiqueta =
          OPCIONES_SATISFACCION.find((opcion) => opcion.valor === respuesta?.valor)?.label ??
          etiqueta
      } else if (item.tipo === "opcion_unica") {
        etiqueta =
          item.opciones.find((opcion) => opcion.id === respuesta?.valor)?.label ?? etiqueta
      } else if (item.tipo === "texto_libre") {
        etiqueta = respuesta?.valor ? `"${respuesta.valor}"` : "Sin comentarios adicionales."
      }

      return { seccion: item, etiqueta }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CapturaEncuestaTopBar paciente={paciente} onSalir={salir} />
      <ProgresoSeccion
        seccionActual={esRevisionFinal ? TOTAL_PASOS : seccion.numero}
        totalSecciones={TOTAL_PASOS}
        titulo={esRevisionFinal ? "Revisión final" : seccion.titulo}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-4 px-5 py-6">
        {esRevisionFinal ? (
          <RevisionFinalStep
            paciente={paciente}
            encuestador={encuestador}
            fechaHora={fechaHora}
            resumen={construirResumen()}
          />
        ) : (
          <>
            <SeccionEncuestaCard
              numero={seccion.numero}
              titulo={seccion.titulo}
              pregunta={seccion.pregunta}
            >
              {seccion.tipo === "escala_satisfaccion" && (
                <EscalaSatisfaccionInput
                  value={respuestaActual.valor as ValorSatisfaccion | null}
                  onChange={seleccionarValor}
                />
              )}
              {seccion.tipo === "opcion_unica" && (
                <OpcionUnicaInput
                  opciones={seccion.opciones}
                  value={respuestaActual.valor}
                  onChange={seleccionarValor}
                />
              )}
              {seccion.tipo === "texto_libre" && (
                <TextoLibreInput
                  value={respuestaActual.valor ?? ""}
                  onChange={seleccionarValor}
                />
              )}

              {requiereMotivo && (
                <div className="mt-4">
                  <MotivoCalificacionPanel
                    motivo={respuestaActual.motivo ?? MOTIVO_VACIO}
                    onChange={cambiarMotivo}
                  />
                </div>
              )}
            </SeccionEncuestaCard>

            {siguienteSeccion && (
              <SeccionEncuestaCard
                numero={siguienteSeccion.numero}
                titulo={siguienteSeccion.titulo}
                pregunta={siguienteSeccion.pregunta}
                bloqueada
              >
                {siguienteSeccion.tipo === "escala_satisfaccion" && (
                  <EscalaSatisfaccionInput
                    value={null}
                    onChange={() => undefined}
                    disabled
                  />
                )}
                {siguienteSeccion.tipo === "opcion_unica" && (
                  <OpcionUnicaInput
                    opciones={siguienteSeccion.opciones}
                    value={null}
                    onChange={() => undefined}
                    disabled
                  />
                )}
                {siguienteSeccion.tipo === "texto_libre" && (
                  <TextoLibreInput value="" onChange={() => undefined} disabled />
                )}
              </SeccionEncuestaCard>
            )}
          </>
        )}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" />
          Online - Sincronizado
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={seccionIndex === 0}
            onClick={anterior}
          >
            <ArrowLeft data-icon="inline-start" />
            Anterior
          </Button>
          <Button type="button" variant="ghost" className="h-11" onClick={guardarBorrador}>
            Guardar borrador
          </Button>
          <Button type="button" className="h-11" disabled={!puedeAvanzar} onClick={siguiente}>
            {esRevisionFinal ? "Finalizar" : "Siguiente"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
