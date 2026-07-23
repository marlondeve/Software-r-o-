import { CheckCircle2, QrCode, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ModoFlujoEtiqueta } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"

interface CicloFinalizadoPanelProps {
  modo: ModoFlujoEtiqueta
  etiqueta: EtiquetaEnfermera
  onEscanearSiguiente: () => void
}

const MENSAJES: Record<ModoFlujoEtiqueta, { titulo: string; subtitulo: string }> = {
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
  devolucion: {
    titulo: "Devolución registrada",
    subtitulo:
      "La bandeja fue registrada como devuelta a cocina exitosamente.",
  },
}

export function CicloFinalizadoPanel({
  modo,
  etiqueta,
  onEscanearSiguiente,
}: CicloFinalizadoPanelProps) {
  const msg = MENSAJES[modo]
  const hora =
    modo === "entrega"
      ? etiqueta.horaEntrega
      : modo === "devolucion"
        ? etiqueta.horaDevolucion
        : etiqueta.horaPreEntrega

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="rounded-t-xl border border-b-0 border-border bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground">
        <WifiOff className="mr-1 inline size-3.5" aria-hidden />
        Modo demo: los datos se guardan en esta sesión. En producción se sincronizarán al recuperar la red.
      </div>

      <Card className="rounded-t-none pt-6">
        <CardContent className="space-y-5 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-9 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">{msg.titulo}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{msg.subtitulo}</p>
          </div>

          <div className="divide-y rounded-lg border text-left text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-xs uppercase text-muted-foreground">Paciente</span>
              <span className="font-medium">Hab. {etiqueta.habitacion}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-xs uppercase text-muted-foreground">Dieta</span>
              <span>{etiqueta.tipoDieta}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-xs uppercase text-muted-foreground">Hora</span>
              <span>{hora ?? "—"}</span>
            </div>
          </div>

          {modo !== "pre-entrega" && (
            <Button type="button" className="w-full gap-2" onClick={onEscanearSiguiente}>
              <QrCode className="size-4" />
              Escanear siguiente bandeja
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
