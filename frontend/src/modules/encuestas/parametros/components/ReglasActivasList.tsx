import { Clock, CircleCheck, PencilLine, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReglaActiva } from "@/modules/encuestas/parametros/datos/mockParametrosReglas"

interface ReglasActivasListProps {
  reglas: ReglaActiva[]
  onEditar: (regla: ReglaActiva) => void
  onEliminar: (regla: ReglaActiva) => void
}

export function ReglasActivasList({ reglas, onEditar, onEliminar }: ReglasActivasListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Reglas Activas en SIAO</h2>

      <div className="space-y-3">
        {reglas.map((regla) => (
          <div
            key={regla.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {regla.id}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{regla.descripcion}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full font-medium",
                      regla.estado === "activa"
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {regla.estado === "activa" ? (
                      <CircleCheck data-icon="inline-start" />
                    ) : (
                      <Clock data-icon="inline-start" />
                    )}
                    {regla.estado === "activa" ? "Activa" : "Borrador"}
                  </Badge>
                  <span>Modificado: {regla.modificado}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label={`Editar ${regla.id}`}
                onClick={() => onEditar(regla)}
              >
                <PencilLine className="size-4" />
              </Button>
              {regla.estado === "activa" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 text-destructive hover:text-destructive"
                  aria-label={`Eliminar ${regla.id}`}
                  onClick={() => onEliminar(regla)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
