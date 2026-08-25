import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { useCallback, useRef, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { EscannerEtiquetaPanel } from "@/modules/dietas-cocina/etiquetas/components/EscannerEtiquetaPanel"
import { IngresoManualEtiquetaDialog } from "@/modules/dietas-cocina/etiquetas/components/IngresoManualEtiquetaDialog"
import { RegistroDevolucionForm } from "@/modules/dietas-cocina/etiquetas/components/RegistroDevolucionForm"
import { ETIQUETAS_TOTAL_PASOS_FLUJO } from "@/modules/dietas-cocina/etiquetas/lib/flujosEtiquetaSteps"
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
import {
  obtenerPrimeraRutaLogisticaPermitida,
  RUTAS_LOGISTICA,
} from "@/modules/dietas-cocina/lib/rutasLogistica"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { mensajeEtiquetaNoEncontrada } from "@/modules/dietas-cocina/etiquetas/lib/mensajesEtiquetasOffline"

interface DevolucionFlowPageProps {
  tipo?: TipoDevolucionEtiqueta
}

export function DevolucionFlowPage({ tipo: tipoProp }: DevolucionFlowPageProps) {
  const { tipo: tipoParam } = useParams<{ tipo: string }>()
  const tipo = tipoProp ?? parseTipoDevolucionParam(tipoParam)
  const navigate = useNavigate()
  const rol = useRolVistaEfectivo()
  const { buscarPorCodigoAsync, confirmarDevolucion, estaOnline } = useCicloBandejas()
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

  const procesarCodigo = useCallback(
    async (codigo: string) => {
      if (!tipo || pasoRef.current >= 2) {
        return
      }

      const ticket = ++procesandoCodigoRef.current
      const encontrada = await buscarPorCodigoAsync(codigo)
      if (ticket !== procesandoCodigoRef.current) return
      if (pasoRef.current >= 2) return

      if (!encontrada) {
        setError(mensajeEtiquetaNoEncontrada(estaOnline))
        return
      }
      const motivoBloqueo = motivoNoDevolucionPorTipo(encontrada, tipo)
      if (motivoBloqueo) {
        setError(motivoBloqueo)
        return
      }
      setError(null)
      setEtiqueta(encontrada)
      setMotivo(null)
      setObservaciones("")
      setFotoArchivo(null)
      setEscaneando(false)
      setPaso(2)
    },
    [buscarPorCodigoAsync, tipo, estaOnline],
  )

  if (!tipo) {
    const destino =
      obtenerPrimeraRutaLogisticaPermitida(rol) ?? "/dietas-cocina/inicio"
    return <Navigate to={destino} replace />
  }

  const tipoDevolucion = tipo
  const config = configDevolucionPorTipo(tipoDevolucion)
  const motivos = motivosDevolucionPorTipo(tipoDevolucion)

  function volverAEscanear() {
    setPaso(1)
    setEtiqueta(null)
    setMotivo(null)
    setObservaciones("")
    setFotoArchivo(null)
    setEscaneando(true)
    setError(null)
  }

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
      navigate(RUTAS_LOGISTICA.pisoExito, {
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

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo={config.titulo}
      paso={paso}
      totalPasos={ETIQUETAS_TOTAL_PASOS_FLUJO}
      rutaVolver={paso === 1 ? RUTAS_LOGISTICA.piso : undefined}
      onVolver={paso === 2 ? volverAEscanear : undefined}
      etiquetaVolver={paso === 2 ? "Escanear de nuevo" : "Bandejas en piso"}
      footer={
        paso === 2 ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={!motivo || confirmando}
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
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
    </EtiquetasEnfermeraFlowLayout>
  )
}
