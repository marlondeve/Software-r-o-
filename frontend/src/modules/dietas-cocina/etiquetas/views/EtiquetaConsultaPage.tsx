import { useEffect, useState } from "react"
import { Check, QrCode } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FlowCardSkeleton } from "@/components/shared/skeletons"
import { DetalleAsignacionPanel } from "@/modules/dietas-cocina/etiquetas/components/DetalleAsignacionPanel"
import { OrdenCocinaContextoCard } from "@/modules/dietas-cocina/etiquetas/components/OrdenCocinaContextoCard"
import { ETIQUETAS_TOTAL_PASOS_FLUJO } from "@/modules/dietas-cocina/etiquetas/lib/flujosEtiquetaSteps"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { esRecogidaPostEntrega } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import { extraerCodigoDesdeQr } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { puedeConfirmarEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { RUTAS_LOGISTICA } from "@/modules/dietas-cocina/lib/rutasLogistica"
import { mensajeEtiquetaNoEncontrada } from "@/modules/dietas-cocina/etiquetas/lib/mensajesEtiquetasOffline"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

export function EtiquetaConsultaPage() {
  const { codigo: codigoParam } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  const { buscarPorCodigoAsync, confirmarEntrega, getOrdenByEtiquetaId, estaOnline } =
    useCicloBandejas()
  const [verificado, setVerificado] = useState(false)
  const [etiqueta, setEtiqueta] = useState<EtiquetaEnfermera | undefined>()
  const [cargando, setCargando] = useState(true)

  const codigo = codigoParam ? extraerCodigoDesdeQr(codigoParam) : ""

  useEffect(() => {
    if (!codigo) {
      setEtiqueta(undefined)
      setCargando(false)
      return
    }
    let cancelado = false
    setCargando(true)
    void buscarPorCodigoAsync(codigo).then((encontrada) => {
      if (!cancelado) {
        setEtiqueta(encontrada)
        setCargando(false)
      }
    })
    return () => {
      cancelado = true
    }
  }, [codigo, buscarPorCodigoAsync])

  const orden = etiqueta ? getOrdenByEtiquetaId(etiqueta.id) : undefined
  const puedeRegistrar = etiqueta ? puedeConfirmarEntrega(etiqueta) : false

  function registrarEntrega() {
    if (!etiqueta || !verificado || !puedeRegistrar) return
    confirmarEntrega(etiqueta.id)
    navigate(`${RUTAS_LOGISTICA.pisoExito}?modo=entrega&etiquetaId=${encodeURIComponent(etiqueta.id)}`, {
      state: { modo: "entrega", etiquetaId: etiqueta.id },
    })
  }

  if (cargando) {
    return (
      <EtiquetasEnfermeraFlowLayout
        titulo="Entrega al paciente"
        paso={2}
        totalPasos={ETIQUETAS_TOTAL_PASOS_FLUJO}
        rutaVolver={RUTAS_LOGISTICA.pisoEntrega}
        etiquetaVolver="Escanear"
        ocultarVolver={false}
      >
        <FlowCardSkeleton />
      </EtiquetasEnfermeraFlowLayout>
    )
  }

  if (!etiqueta) {
    return (
      <EtiquetasEnfermeraFlowLayout
        titulo="Entrega al paciente"
        paso={2}
        totalPasos={ETIQUETAS_TOTAL_PASOS_FLUJO}
        rutaVolver={RUTAS_LOGISTICA.pisoEntrega}
        etiquetaVolver="Escanear"
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <QrCode className="size-7 text-muted-foreground" />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Etiqueta no encontrada</p>
            <p className="text-sm text-muted-foreground">
              {mensajeEtiquetaNoEncontrada(estaOnline)}
            </p>
          </div>
          {codigo && (
            <p className="font-mono text-sm text-muted-foreground">{codigo}</p>
          )}
          <Button type="button" variant="outline" asChild>
            <Link to={RUTAS_LOGISTICA.pisoEntrega}>Escanear otra etiqueta</Link>
          </Button>
        </div>
      </EtiquetasEnfermeraFlowLayout>
    )
  }

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo="Entrega al paciente"
      paso={2}
      totalPasos={ETIQUETAS_TOTAL_PASOS_FLUJO}
      rutaVolver={RUTAS_LOGISTICA.pisoEntrega}
      etiquetaVolver="Escanear"
      footer={
        puedeRegistrar ? (
          <Button
            type="button"
            className="w-full gap-2"
            disabled={!verificado}
            onClick={registrarEntrega}
          >
            <Check className="size-4" />
            Registrar entrega al paciente
          </Button>
        ) : (
          <Alert>
            <AlertDescription className="text-center text-sm">
              {etiqueta.estadoLogistica === "entregada"
                ? "Esta bandeja ya fue entregada al paciente."
                : etiqueta.estadoLogistica === "devuelta"
                  ? esRecogidaPostEntrega(etiqueta)
                    ? "Esta bandeja fue recogida por enfermería."
                    : "Esta bandeja fue rechazada antes de la entrega al paciente."
                  : "La bandeja debe estar recibida del proveedor antes de registrar la entrega."}
            </AlertDescription>
          </Alert>
        )
      }
    >
      <div className="space-y-4">
        {orden && <OrdenCocinaContextoCard orden={orden} etiqueta={etiqueta} />}
        <DetalleAsignacionPanel
          etiqueta={etiqueta}
          confirmado={verificado}
          onConfirmadoChange={setVerificado}
          mostrarVerificacion={puedeRegistrar}
        />
        {puedeRegistrar && !verificado && (
          <p className="text-center text-sm text-muted-foreground">
            Marca la verificación de identidad del paciente para habilitar el
            registro de entrega.
          </p>
        )}
      </div>
    </EtiquetasEnfermeraFlowLayout>
  )
}
