import { GripVertical, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  TIPOS_RESPUESTA,
  type PreguntaEditor,
} from "@/modules/encuestas/editor-cuestionario/datos/mockEditorCuestionario"

interface PreguntaEditorPanelProps {
  pregunta: PreguntaEditor
  onCambiar: <K extends keyof PreguntaEditor>(campo: K, valor: PreguntaEditor[K]) => void
  onCambiarOpcion: (opcionId: string, texto: string) => void
  onToggleOpcionNegativa: (opcionId: string) => void
  onAnadirOpcion: () => void
}

export function PreguntaEditorPanel({
  pregunta,
  onCambiar,
  onCambiarOpcion,
  onToggleOpcionNegativa,
  onAnadirOpcion,
}: PreguntaEditorPanelProps) {
  const muestraOpciones = pregunta.tipoRespuesta !== "numerico" && pregunta.tipoRespuesta !== "texto_libre"

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex-row items-center justify-between border-b py-3">
        <CardTitle className="text-base font-semibold">Editor de Pregunta</CardTitle>
        <Badge variant="secondary" className="font-mono text-[11px]">
          ID: {pregunta.id}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Texto de la Pregunta <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={pregunta.texto}
            onChange={(event) => onCambiar("texto", event.target.value)}
            className="min-h-24"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Código Interno<span className="text-destructive">*</span>
            </Label>
            <Input
              value={pregunta.codigoInterno}
              onChange={(event) => onCambiar("codigoInterno", event.target.value)}
              className="h-9 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Descripción /Instrucción</Label>
            <Input
              value={pregunta.descripcion}
              onChange={(event) => onCambiar("descripcion", event.target.value)}
              placeholder="Ej: Ayuda para el encuestador..."
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Tipo de Respuesta</Label>
          <Select
            value={pregunta.tipoRespuesta}
            onValueChange={(value) => {
              const tipo = TIPOS_RESPUESTA.find((item) => item.value === value)
              onCambiar("tipoRespuesta", value as PreguntaEditor["tipoRespuesta"])
              if (tipo) onCambiar("tipoBadgeLabel", tipo.badge)
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_RESPUESTA.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {muestraOpciones && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Opciones de Respuesta</Label>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center justify-between bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                <span>Texto de opción</span>
                <span>Negativa</span>
              </div>
              <div className="divide-y divide-border">
                {pregunta.opciones.map((opcion) => (
                  <div key={opcion.id} className="flex items-center gap-2 px-3 py-2">
                    <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      value={opcion.texto}
                      onChange={(event) => onCambiarOpcion(opcion.id, event.target.value)}
                      className="h-8 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-1"
                    />
                    <Switch
                      checked={opcion.esNegativa}
                      onCheckedChange={() => onToggleOpcionNegativa(opcion.id)}
                      className="data-[state=checked]:bg-destructive"
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-none border-t"
                onClick={onAnadirOpcion}
              >
                <Plus data-icon="inline-start" />
                Añadir Opción
              </Button>
            </div>
            <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              Marca negativa genera alerta
              <span className="size-1.5 rounded-full bg-destructive" />
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
