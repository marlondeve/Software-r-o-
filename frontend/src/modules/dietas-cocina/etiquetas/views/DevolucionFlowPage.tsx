import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { useCallback, useRef, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { EscannerEtiquetaPanel } from "@/modules/dietas-cocina/etiquetas/components/EscannerEtiquetaPanel"
import { IngresoManualEtiquetaDialog } from "@/modules/dietas-cocina/etiquetas/components/IngresoManualEtiquetaDialog"
import { RegistroDevolucionForm } from "@/modules/dietas-cocina/etiquetas/components/RegistroDevolucionForm"
import { BandejaResumenCard } from "@/modules/dietas-cocina/etiquetas/components/BandejaResumenCard"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import {
  configDevolucionPorTipo,
  estadoDietaDevolucionPorMotivo,
  motivoNoDevolucionPorTipo,
  motivosDevolucionPorTipo,
  parseTipoDevolucionParam,
  type MotivoDevolucionFlujo,
  type TipoDevolucionEtiqueta,
} from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"

interface DevolucionFlowPageProps {
  tipo?: TipoDevolucionEtiqueta
}

export function DevolucionFlowPage({ tipo: tipoProp }: DevolucionFlowPageProps) {
  const { tipo: tipoParam } = useParams<{ tipo: string }>()
  const tipo = tipoProp ?? parseTipoDevolucionParam(tipoParam)
  const navigate = useNavigate()
  const { buscarPorCodigoAsync, confirmarDevolucion } = useCicloBandejas()
  const [paso, setPaso] = useState(1)
  const [etiqueta, setEtiqueta] = useState<EtiquetaEnfermera | null>(null)
  const [motivo, setMotivo] = useState<MotivoDevolucionFlujo | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualAbierto, setManualAbierto] = useState(false)
  const [escaneando, setEscaneando] = useState(true)
  const [confirmando, setConfirmando] = useState(false)
  const pasoRef = useRef(paso)
  const procesandoCodigoRef = useRef(0)

  pasoRef.current = paso

  if (!tipo) {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  const tipoDevolucion = tipo
  const config = configDevolucionPorTipo(tipoDevolucion)
  const motivos = motivosDevolucionPorTipo(tipoDevolucion)

  const procesarCodigo = useCallback(
    async (codigo: string) => {
      if (pasoRef.current >= 2) {
        return
      }

      const ticket = ++procesandoCodigoRef.current
      const encontrada = await buscarPorCodigoAsync(codigo)
      if (ticket !== procesandoCodigoRef.current) return
      if (pasoRef.current >= 2) return

      if (!encontrada) {
        setError("No se encontró una etiqueta con ese código.")
        return
      }
      const motivoBloqueo = motivoNoDevolucionPorTipo(encontrada, tipoDevolucion)
      if (motivoBloqueo) {
        setError(motivoBloqueo)
        return
      }
      setError(null)
      setEtiqueta(encontrada)
      setObservaciones("")
      setFotoArchivo(null)
      setEscaneando(false)
      setPaso(2)
    },
    [buscarPorCodigoAsync, tipoDevolucion],
  )

  async function confirmarDevolucionClick() {
    if (!etiqueta || !motivo) return
    setConfirmando(true)
    try {
      await confirmarDevolucion(etiqueta.id, {
        motivo,
        observaciones,
        fotoDevolucion: fotoArchivo?.name,
        fotoArchivo: fotoArchivo ?? undefined,
        tipoDevolucion: tipoDevolucion,
        estadoDieta: estadoDietaDevolucionPorMotivo(tipoDevolucion, motivo),
      })
      navigate("/dietas-cocina/etiquetas/exito", {
        state: {
          modo: "devolucion",
          tipoDevolucion: tipoDevolucion,
          etiquetaId: etiqueta.id,
        },
      })
    } catch {
      demoToast("No se pudo registrar la devolución.", "error")
    } finally {
      setConfirmando(false)
    }
  }

  function avanzarAConfirmacion() {
    if (!motivo) return
    setPaso(3)
  }

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo={config.titulo}
      paso={paso}
      totalPasos={3}
      footer={
        paso === 2 ? (
          <Button
            type="button"
            className="w-full"
            disabled={!motivo}
            onClick={avanzarAConfirmacion}
          >
            Continuar a confirmación
          </Button>
        ) : paso === 3 ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={confirmando}
            onClick={() => void confirmarDevolucionClick()}
          >
            Confirmar devolución
          </Button>
        ) : undefined
      }
    >
      {paso === 1 && (
        <>
          <EscannerEtiquetaPanel
            modo="devolucion"
            guia={config.guiaEscaneo}
            activo={escaneando}
            mostrarEncabezado={false}
            onCodigoLeido={procesarCodigo}
            onIngresoManual={() => setManualAbierto(true)}
          />
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <IngresoManualEtiquetaDialog
            abierto={manualAbierto}
            onAbiertoChange={setManualAbierto}
            onConfirmar={procesarCodigo}
          />
        </>
      )}
      {paso === 2 && etiqueta && (
        <RegistroDevolucionForm
          etiqueta={etiqueta}
          motivo={motivo}
          motivos={motivos}
          descripcion={config.descripcionFormulario}
          etiquetaMotivo={config.etiquetaMotivo}
          observaciones={observaciones}
          onMotivoChange={setMotivo}
          onObservacionesChange={setObservaciones}
          onFotoChange={setFotoArchivo}
        />
      )}
      {paso === 3 && etiqueta && motivo && (
        <div className="mx-auto max-w-lg space-y-4">
          <BandejaResumenCard etiqueta={etiqueta} />
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Tipo de devolución
            </p>
            <p className="mt-1 font-medium text-foreground">{config.titulo}</p>
            <p className="mt-3 text-xs font-medium uppercase text-muted-foreground">
              {config.etiquetaMotivo}
            </p>
            <p className="mt-1 font-medium text-foreground">{motivo}</p>
            {observaciones.trim() && (
              <>
                <p className="mt-3 text-xs font-medium uppercase text-muted-foreground">
                  Observaciones
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{observaciones}</p>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Revisa el motivo y confirma la devolución a cocina.
          </p>
        </div>
      )}
    </EtiquetasEnfermeraFlowLayout>
  )
}
