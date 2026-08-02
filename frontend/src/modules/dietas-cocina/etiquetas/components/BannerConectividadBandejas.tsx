import { Loader2, RefreshCw, WifiOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { useCicloBandejasOpcional } from "@/modules/dietas-cocina/context/cicloBandejasContextStore"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { useConectividadRed } from "@/hooks/useConectividadRed"

interface BannerConectividadBandejasProps {
  className?: string
}

export function BannerConectividadBandejas({
  className,
}: BannerConectividadBandejasProps) {
  const apiActiva = usarApiDietasCocina()
  const estaOnlineHook = useConectividadRed()
  const ciclo = useCicloBandejasOpcional()

  const estaOnline = ciclo?.estaOnline ?? estaOnlineHook
  const pendientes = ciclo?.cantidadPendientesSync ?? 0
  const conflictos = ciclo?.cantidadConflictosSync ?? 0
  const sincronizando = ciclo?.sincronizandoBandejas ?? false

  if (!apiActiva) return null
  if (estaOnline && pendientes === 0 && conflictos === 0 && !sincronizando) {
    return null
  }

  let icono = <WifiOff className="mr-1 inline size-3.5 shrink-0" aria-hidden />
  let mensaje =
    "Sin conexión. Los registros se guardan en este dispositivo y se sincronizarán al recuperar la red."

  if (estaOnline && sincronizando) {
    icono = (
      <Loader2
        className="mr-1 inline size-3.5 shrink-0 animate-spin"
        aria-hidden
      />
    )
    mensaje = "Sincronizando registros pendientes con el servidor…"
  } else if (estaOnline && conflictos > 0) {
    icono = <RefreshCw className="mr-1 inline size-3.5 shrink-0" aria-hidden />
    mensaje =
      conflictos === 1
        ? "1 registro con conflicto de sincronización. Revise el panel de conflictos para descartar o reintentar."
        : `${conflictos} registros con conflicto de sincronización. Revise el panel de conflictos para descartar o reintentar.`
  } else if (estaOnline && pendientes > 0) {
    icono = <RefreshCw className="mr-1 inline size-3.5 shrink-0" aria-hidden />
    mensaje =
      pendientes === 1
        ? "1 registro pendiente de sincronizar. Mantenga la conexión para dejar todo actualizado."
        : `${pendientes} registros pendientes de sincronizar. Mantenga la conexión para dejar todo actualizado.`
  }

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      {icono}
      {mensaje}
    </div>
  )
}
