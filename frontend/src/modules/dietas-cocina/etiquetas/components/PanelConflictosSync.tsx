import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCicloBandejasOpcional } from "@/modules/dietas-cocina/context/cicloBandejasContextStore"
import { listarOperacionesConConflicto } from "@/modules/dietas-cocina/lib/bandejasOutbox"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"

interface PanelConflictosSyncProps {
  className?: string
}

const ETIQUETA_OPERACION: Record<string, string> = {
  pre_entrega: "Recepción",
  entrega: "Entrega",
  devolucion: "Devolución",
}

export function PanelConflictosSync({ className }: PanelConflictosSyncProps) {
  const apiActiva = usarApiDietasCocina()
  const ciclo = useCicloBandejasOpcional()
  const conflictos = listarOperacionesConConflicto()

  if (!apiActiva || !ciclo || ciclo.cantidadConflictosSync === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        Registros con conflicto de sincronización
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        El servidor rechazó estos registros (estado distinto al esperado). Descarte
        los locales o reintente tras actualizar datos en línea.
      </p>
      <ul className="space-y-2">
        {conflictos.map((op) => (
          <li
            key={op.clientId}
            className="flex flex-col gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 text-xs">
              <span className="font-medium">
                {ETIQUETA_OPERACION[op.tipo] ?? op.tipo}
              </span>
              {op.ultimoError && (
                <p className="mt-0.5 truncate text-muted-foreground">
                  {op.ultimoError}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void ciclo.descartarConflictoSync(op.clientId)}
              >
                Descartar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => ciclo.reintentarConflictoSync(op.clientId)}
              >
                Reintentar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
