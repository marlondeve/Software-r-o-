import { Camera, Flashlight, Keyboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ModoFlujoEtiqueta } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { useEscannerQr } from "@/modules/dietas-cocina/etiquetas/hooks/useEscannerQr"

interface EscannerEtiquetaPanelProps {
  modo: ModoFlujoEtiqueta
  onCodigoLeido: (codigo: string) => void
  onIngresoManual: () => void
  activo?: boolean
}

const TITULOS: Record<ModoFlujoEtiqueta, string> = {
  "pre-entrega": "Recepción del proveedor",
  entrega: "Entrega al paciente",
  devolucion: "Registro de devolución",
}

const GUIAS: Record<ModoFlujoEtiqueta, string> = {
  "pre-entrega":
    "Alinea el código QR de la bandeja para registrar que la recibiste del proveedor.",
  entrega:
    "Alinea el código QR de la bandeja dentro del marco para validar la entrega al paciente.",
  devolucion: "Escanea el código QR de la bandeja que se devuelve a cocina.",
}

export function EscannerEtiquetaPanel({
  modo,
  onCodigoLeido,
  onIngresoManual,
  activo = true,
}: EscannerEtiquetaPanelProps) {
  const { contenedorId, errorCamara, alternarCamara, alternarLinterna, iniciando } =
    useEscannerQr({ onCodigoLeido, activo })

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{TITULOS[modo]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{GUIAS[modo]}</p>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-zinc-900">
        <div
          id={contenedorId}
          className="min-h-[280px] w-full [&_video]:object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="size-52 rounded-lg border-2 border-lime-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        {iniciando && (
          <p className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">
            Iniciando cámara…
          </p>
        )}
      </div>

      {errorCamara && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          {errorCamara}
        </p>
      )}

      <div className="flex justify-center gap-6">
        <button
          type="button"
          onClick={() => void alternarLinterna()}
          className="flex flex-col items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Flashlight className="size-5" />
          </span>
          Linterna
        </button>
        <button
          type="button"
          onClick={alternarCamara}
          className="flex flex-col items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Camera className="size-5" />
          </span>
          Cámara
        </button>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
            <Keyboard className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Ingreso manual</p>
            <p className="text-sm text-muted-foreground">¿El código no se lee?</p>
          </div>
          <Button type="button" size="sm" onClick={onIngresoManual}>
            Ingresar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
