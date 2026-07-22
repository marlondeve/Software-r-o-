import type { ComidaTab } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { cn } from "@/lib/utils"

interface DietasComidaTabsProps {
  comidas: ComidaTab[]
  comidaActiva: TiempoComida
  onComidaChange: (id: TiempoComida) => void
}

export function DietasComidaTabs({
  comidas,
  comidaActiva,
  onComidaChange,
}: DietasComidaTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {comidas.map((comida) => {
        const activa = comida.id === comidaActiva
        return (
          <button
            key={comida.id}
            type="button"
            onClick={() => onComidaChange(comida.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              activa
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {comida.label}
          </button>
        )
      })}
    </div>
  )
}
