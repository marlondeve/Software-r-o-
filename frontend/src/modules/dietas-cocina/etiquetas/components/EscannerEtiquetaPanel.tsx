import type { ModoFlujoEtiqueta } from "@/modules/dietas-cocina/types/enums"
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Flashlight,
  Keyboard,
  RefreshCw,
  ScanLine,
  ShieldAlert,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEscannerQr } from "@/modules/dietas-cocina/etiquetas/hooks/useEscannerQr"
import { cn } from "@/lib/utils"

interface EscannerEtiquetaPanelProps {
  modo: ModoFlujoEtiqueta
  onCodigoLeido: (codigo: string) => void
  onIngresoManual: () => void
  activo?: boolean
  titulo?: string
  guia?: string
  /** Evita duplicar el título cuando el layout padre ya lo muestra. */
  mostrarEncabezado?: boolean
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
  titulo,
  guia,
  mostrarEncabezado = true,
}: EscannerEtiquetaPanelProps) {
  const {
    contenedorId,
    errorCamara,
    tipoError,
    alternarCamara,
    alternarLinterna,
    reintentar,
    iniciando,
    camaraActiva,
  } = useEscannerQr({ onCodigoLeido, activo })

  const textoGuia = guia ?? GUIAS[modo]
  const falloCamara = Boolean(errorCamara)
  const requiereHttps = tipoError === "inseguro"

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      {(mostrarEncabezado || textoGuia) && (
        <div className={cn("space-y-1", mostrarEncabezado ? "text-center" : "")}>
          {mostrarEncabezado && (
            <h2 className="text-lg font-semibold text-foreground">
              {titulo ?? TITULOS[modo]}
            </h2>
          )}
          <p className="text-sm text-muted-foreground">{textoGuia}</p>
        </div>
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-zinc-950",
          falloCamara ? "border-dashed border-muted-foreground/40" : "border-transparent",
        )}
      >
        <div
          id={contenedorId}
          className={cn(
            "aspect-4/3 w-full overflow-hidden transition-opacity",
            camaraActiva ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
            "[&_video]:size-full [&_video]:object-cover",
          )}
        />

        {!camaraActiva && (
          <div className="flex aspect-4/3 flex-col items-center justify-center gap-3 px-6 text-center">
            {iniciando ? (
              <>
                <ScanLine className="size-12 animate-pulse text-primary" aria-hidden />
                <p className="text-sm text-muted-foreground">Iniciando cámara…</p>
              </>
            ) : requiereHttps ? (
              <>
                <ShieldAlert className="size-12 text-amber-500" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Cámara bloqueada en HTTP
                </p>
                <p className="text-xs text-muted-foreground">
                  Los navegadores solo permiten cámara con HTTPS o en localhost.
                </p>
              </>
            ) : (
              <>
                <CameraOff className="size-12 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Vista previa no disponible
                </p>
                <p className="text-xs text-muted-foreground">
                  Reintenta o ingresa el código manualmente.
                </p>
              </>
            )}
          </div>
        )}

        {camaraActiva && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="size-56 rounded-xl border-2 border-lime-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {camaraActiva && (
          <p className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2 text-center text-xs text-white/90">
            Enfoca el QR dentro del marco
          </p>
        )}
      </div>

      {errorCamara && (
        <Alert variant={requiereHttps ? "default" : "destructive"} className="border-amber-500/30 bg-amber-500/5">
          {requiereHttps ? (
            <ShieldAlert className="size-4 text-amber-600" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          <AlertTitle className="text-sm">{errorCamara.mensaje}</AlertTitle>
          {errorCamara.sugerencia && (
            <AlertDescription className="text-xs">{errorCamara.sugerencia}</AlertDescription>
          )}
          {!requiereHttps && (
            <div className="mt-3">
              <Button type="button" size="sm" variant="outline" onClick={reintentar}>
                <RefreshCw className="size-4" data-icon="inline-start" />
                Reintentar cámara
              </Button>
            </div>
          )}
        </Alert>
      )}

      <div
        className={cn(
          "flex justify-center gap-6",
          !camaraActiva && "opacity-50",
        )}
      >
        <button
          type="button"
          disabled={!camaraActiva}
          onClick={() => void alternarLinterna()}
          className="flex flex-col items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground disabled:cursor-not-allowed"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Flashlight className="size-5" />
          </span>
          Linterna
        </button>
        <button
          type="button"
          disabled={iniciando}
          onClick={alternarCamara}
          className="flex flex-col items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground disabled:cursor-not-allowed"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Camera className="size-5" />
          </span>
          {camaraActiva ? "Cambiar cámara" : "Activar cámara"}
        </button>
      </div>

      <Card
        className={cn(
          falloCamara && "border-primary/40 ring-1 ring-primary/20",
        )}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
            <Keyboard className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Ingreso manual</p>
            <p className="text-sm text-muted-foreground">
              {falloCamara
                ? "Recomendado mientras se habilita HTTPS o la cámara."
                : "¿El código no se lee?"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={falloCamara ? "default" : "outline"}
            onClick={onIngresoManual}
          >
            Ingresar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
