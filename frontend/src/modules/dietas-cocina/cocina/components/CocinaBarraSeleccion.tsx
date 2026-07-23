import { ChefHat, ClipboardCheck, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CocinaBarraSeleccionProps {
  cantidad: number
  visible: boolean
  puedePreparacion: boolean
  puedeLista: boolean
  puedeDespacho: boolean
  onMarcarEnPreparacion: () => void
  onMarcarComoLista: () => void
  onRegistrarDespacho: () => void
}

export function CocinaBarraSeleccion({
  cantidad,
  visible,
  puedePreparacion,
  puedeLista,
  puedeDespacho,
  onMarcarEnPreparacion,
  onMarcarComoLista,
  onRegistrarDespacho,
}: CocinaBarraSeleccionProps) {
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
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!puedePreparacion}
            title={
              puedePreparacion
                ? undefined
                : "Selecciona órdenes en estado por iniciar o en preparación"
            }
            onClick={onMarcarEnPreparacion}
          >
            <ChefHat data-icon="inline-start" />
            Marcar en preparación
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!puedeLista}
            title={
              puedeLista
                ? undefined
                : "Selecciona bandejas en preparación con checklist obligatorio completo"
            }
            onClick={onMarcarComoLista}
          >
            <ClipboardCheck data-icon="inline-start" />
            Marcar como lista
          </Button>
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
    </div>
  )
}
