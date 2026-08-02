import { WifiOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { useConectividadRed } from "@/hooks/useConectividadRed"

interface BannerModuloSinConexionProps {
  /** Si true, indica que los datos mostrados provienen de caché local. */
  datosEnCache?: boolean
  className?: string
}

export function BannerModuloSinConexion({
  datosEnCache = true,
  className,
}: BannerModuloSinConexionProps) {
  const apiActiva = usarApiDietasCocina()
  const estaOnline = useConectividadRed()

  if (!apiActiva || estaOnline) return null

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      <WifiOff className="mr-1 inline size-3.5 shrink-0" aria-hidden />
      {datosEnCache
        ? "Sin conexión. Se muestran los datos guardados en este dispositivo. Las acciones que requieran servidor quedarán pendientes o no estarán disponibles."
        : "Sin conexión. Conecte a la red para actualizar esta sección."}
    </div>
  )
}
