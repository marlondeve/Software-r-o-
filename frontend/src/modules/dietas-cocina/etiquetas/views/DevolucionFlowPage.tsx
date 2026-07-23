import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { EscannerEtiquetaPanel } from "@/modules/dietas-cocina/etiquetas/components/EscannerEtiquetaPanel"
import { IngresoManualEtiquetaDialog } from "@/modules/dietas-cocina/etiquetas/components/IngresoManualEtiquetaDialog"
import { RegistroDevolucionForm } from "@/modules/dietas-cocina/etiquetas/components/RegistroDevolucionForm"
import { BandejaResumenCard } from "@/modules/dietas-cocina/etiquetas/components/BandejaResumenCard"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import type {
  EtiquetaEnfermera,
  MotivoDevolucion,
} from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"

export function DevolucionFlowPage() {
  const navigate = useNavigate()
  const { buscarPorCodigo, confirmarDevolucion } = useCicloBandejas()
  const [paso, setPaso] = useState(1)
  const [etiqueta, setEtiqueta] = useState<EtiquetaEnfermera | null>(null)
  const [motivo, setMotivo] = useState<MotivoDevolucion | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [fotoDevolucion, setFotoDevolucion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualAbierto, setManualAbierto] = useState(false)
  const [escaneando, setEscaneando] = useState(true)

  const procesarCodigo = useCallback(
    (codigo: string) => {
      const encontrada = buscarPorCodigo(codigo)
      if (!encontrada) {
        setError("No se encontró una etiqueta con ese código.")
        return
      }
      if (
        encontrada.estadoLogistica !== "pre_entregada" &&
        encontrada.estadoLogistica !== "entregada"
      ) {
        setError("Esta bandeja no puede registrarse como devolución.")
        return
      }
      setError(null)
      setEtiqueta(encontrada)
      setMotivo(null)
      setObservaciones("")
      setFotoDevolucion(null)
      setEscaneando(false)
      setPaso(2)
    },
    [buscarPorCodigo],
  )

  function confirmarDevolucionClick() {
    if (!etiqueta || !motivo) return
    confirmarDevolucion(etiqueta.id, {
      motivo,
      observaciones,
      fotoDevolucion: fotoDevolucion ?? undefined,
    })
    navigate("/dietas-cocina/etiquetas/exito", {
      state: { modo: "devolucion", etiquetaId: etiqueta.id },
    })
  }

  function avanzarAConfirmacion() {
    if (!motivo) return
    setPaso(3)
  }

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo="Registro de devolución"
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
            onClick={confirmarDevolucionClick}
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
            activo={escaneando}
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
          observaciones={observaciones}
          onMotivoChange={setMotivo}
          onObservacionesChange={setObservaciones}
          onFotoChange={setFotoDevolucion}
        />
      )}
      {paso === 3 && etiqueta && motivo && (
        <div className="mx-auto max-w-lg space-y-4">
          <BandejaResumenCard etiqueta={etiqueta} />
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Motivo de devolución
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
