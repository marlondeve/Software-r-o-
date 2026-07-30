import { Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CocinaBarraDespachoProps {
  cantidad: number
  visible: boolean
  puedeDespacho: boolean
  onRegistrarDespacho: () => void
}

export function CocinaBarraDespacho({
  cantidad,
  visible,
  puedeDespacho,
  onRegistrarDespacho,
}: CocinaBarraDespachoProps) {
  const etiqueta =
    cantidad === 1
      ? "1 bandeja seleccionada"
      : `${cantidad} bandejas seleccionadas`

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 transition-all duration-200",
        visible ? "opacity-100" : "pointer-events-none h-0 overflow-hidden border-0 p-0 opacity-0",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">{etiqueta}</p>
        <Button
          type="button"
          size="sm"
          disabled={!puedeDespacho}
          title={
            puedeDespacho
              ? undefined
              : "Solo bandejas listas con etiqueta impresa pueden despacharse"
          }
          onClick={onRegistrarDespacho}
        >
          <Truck data-icon="inline-start" />
          Registrar despacho
        </Button>
      </div>
    </div>
  )
}
