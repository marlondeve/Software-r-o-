import { useState } from "react"
import { Check, QrCode } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { DetalleAsignacionPanel } from "@/modules/dietas-cocina/etiquetas/components/DetalleAsignacionPanel"
import { EtiquetaDetalleAsignacionLayout } from "@/modules/dietas-cocina/etiquetas/components/EtiquetaDetalleAsignacionLayout"
import { OrdenCocinaContextoCard } from "@/modules/dietas-cocina/etiquetas/components/OrdenCocinaContextoCard"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { puedeConfirmarEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"

export function EtiquetaConsultaPage() {
  const { codigo: codigoParam } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  const { buscarPorCodigo, confirmarEntrega, getOrdenByEtiquetaId } = useCicloBandejas()
  const [verificado, setVerificado] = useState(false)

  const codigo = codigoParam ? extraerCodigoDesdeQr(codigoParam) : ""
  const etiqueta = codigo ? buscarPorCodigo(codigo) : undefined
  const orden = etiqueta ? getOrdenByEtiquetaId(etiqueta.id) : undefined
  const puedeRegistrar = etiqueta ? puedeConfirmarEntrega(etiqueta) : false

  function registrarEntrega() {
    if (!etiqueta || !verificado || !puedeRegistrar) return
    confirmarEntrega(etiqueta.id)
    navigate(`/dietas-cocina/etiquetas/exito?modo=entrega&etiquetaId=${encodeURIComponent(etiqueta.id)}`, {
      state: { modo: "entrega", etiquetaId: etiqueta.id },
    })
  }

  if (!etiqueta) {
    return (
      <EtiquetaDetalleAsignacionLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <QrCode className="size-7 text-muted-foreground" />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Etiqueta no encontrada</p>
            <p className="text-sm text-muted-foreground">
              No hay una bandeja registrada con el código escaneado.
            </p>
          </div>
          {codigo && (
            <p className="font-mono text-sm text-muted-foreground">{codigo}</p>
          )}
          <Button type="button" variant="outline" asChild>
            <Link to="/dietas-cocina/etiquetas/entrega">Escanear otra etiqueta</Link>
          </Button>
        </div>
      </EtiquetaDetalleAsignacionLayout>
    )
  }

  return (
    <EtiquetaDetalleAsignacionLayout
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
          <p className="text-center text-sm text-muted-foreground">
            {etiqueta.estadoLogistica === "entregada"
              ? "Esta bandeja ya fue entregada al paciente."
              : etiqueta.estadoLogistica === "devuelta"
                ? "Esta bandeja fue devuelta a cocina."
                : "La bandeja debe estar recibida del proveedor antes de registrar la entrega."}
          </p>
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
      </div>
    </EtiquetaDetalleAsignacionLayout>
  )
}
