import type { ModoFlujoEtiqueta } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { CheckCircle2, Home, QrCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BannerConectividadBandejas } from "@/modules/dietas-cocina/etiquetas/components/BannerConectividadBandejas"
import {
  configDevolucionPorTipo,
  type TipoDevolucionEtiqueta,
} from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"

interface CicloFinalizadoPanelProps {
  modo: ModoFlujoEtiqueta
  etiqueta: EtiquetaEnfermera
  tipoDevolucion?: TipoDevolucionEtiqueta
  onEscanearSiguiente: () => void
  onVolverListado?: () => void
}

const MENSAJES: Record<Exclude<ModoFlujoEtiqueta, "devolucion">, { titulo: string; subtitulo: string }> = {
  "pre-entrega": {
    titulo: "Recepción registrada",
    subtitulo:
      "La bandeja fue registrada como recibida del proveedor de cocina.",
  },
  entrega: {
    titulo: "Entrega registrada",
    subtitulo:
      "La bandeja fue entregada al paciente y quedó registrada en el sistema.",
  },
}

export function CicloFinalizadoPanel({
  modo,
  etiqueta,
  tipoDevolucion,
  onEscanearSiguiente,
  onVolverListado,
}: CicloFinalizadoPanelProps) {
  const msg =
    modo === "devolucion" && tipoDevolucion
      ? {
          titulo:
            tipoDevolucion === "post_entrega"
              ? "Recogida registrada"
              : "Rechazo registrado",
          subtitulo: configDevolucionPorTipo(tipoDevolucion).mensajeExito,
        }
      : modo === "devolucion"
        ? {
            titulo: "Cierre registrado",
            subtitulo: "La bandeja quedó registrada en el sistema.",
          }
        : MENSAJES[modo]
  const hora =
    modo === "entrega"
      ? etiqueta.horaEntrega
      : modo === "devolucion"
        ? etiqueta.horaDevolucion
        : etiqueta.horaPreEntrega

  return (
    <div className="w-full space-y-5">
      <BannerConectividadBandejas />

      <Card>
        <CardContent className="space-y-5 pt-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-9 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">{msg.titulo}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{msg.subtitulo}</p>
          </div>

          <div className="divide-y rounded-lg border text-left text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-xs uppercase text-muted-foreground">
                Paciente
              </span>
              <span className="font-medium">Hab. {etiqueta.habitacion}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-xs uppercase text-muted-foreground">
                Dieta
              </span>
              <span>{etiqueta.tipoDieta}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-xs uppercase text-muted-foreground">
                Hora
              </span>
              <span>{hora ?? "—"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {modo !== "pre-entrega" && (
              <Button type="button" className="w-full gap-2" onClick={onEscanearSiguiente}>
                <QrCode className="size-4" />
                Escanear siguiente bandeja
              </Button>
            )}
            {onVolverListado && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={onVolverListado}
              >
                <Home className="size-4" />
                Volver al listado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
