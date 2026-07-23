import { ChevronDown, ChevronRight, GripVertical, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SeccionEditor } from "@/modules/encuestas/editor-cuestionario/datos/mockEditorCuestionario"

interface EstructuraPanelProps {
  secciones: SeccionEditor[]
  seccionesExpandidas: Record<string, boolean>
  preguntaSeleccionadaId: string | null
  onToggleSeccion: (seccionId: string) => void
  onSeleccionarPregunta: (preguntaId: string) => void
  onAnadirSeccion: () => void
  onAnadirPregunta: (seccionId: string) => void
}

export function EstructuraPanel({
  secciones,
  seccionesExpandidas,
  preguntaSeleccionadaId,
  onToggleSeccion,
  onSeleccionarPregunta,
  onAnadirSeccion,
  onAnadirPregunta,
}: EstructuraPanelProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex-row items-center justify-between border-b py-3">
        <CardTitle className="text-base font-semibold">Estructura</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-primary hover:text-primary"
          aria-label="Añadir sección"
          onClick={onAnadirSeccion}
        >
          <Plus className="size-5" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 py-4">
        {secciones.map((seccion) => {
          const expandida = seccionesExpandidas[seccion.id] ?? true
          return (
            <div key={seccion.id} className="rounded-lg border border-border">
              <button
                type="button"
                onClick={() => onToggleSeccion(seccion.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground"
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{seccion.titulo}</span>
                {expandida ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {expandida && (
                <div className="space-y-2 border-t border-border p-2">
                  {seccion.preguntas.map((pregunta) => {
                    const seleccionada = pregunta.id === preguntaSeleccionadaId
                    return (
                      <button
                        key={pregunta.id}
                        type="button"
                        onClick={() => onSeleccionarPregunta(pregunta.id)}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md border-l-[3px] px-2.5 py-2 text-left transition-colors",
                          seleccionada
                            ? "border-l-primary bg-primary/5"
                            : "border-l-transparent hover:bg-muted/60",
                        )}
                      >
                        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-sm text-foreground">{pregunta.texto}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary" className="text-[11px]">
                              {pregunta.tipoBadgeLabel}
                            </Badge>
                            {pregunta.requerida && (
                              <Badge
                                variant="outline"
                                className="border-destructive/25 bg-destructive/10 text-[11px] text-destructive"
                              >
                                Req.
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => onAnadirPregunta(seccion.id)}
                  >
                    <Plus data-icon="inline-start" />
                    Añadir Pregunta
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
