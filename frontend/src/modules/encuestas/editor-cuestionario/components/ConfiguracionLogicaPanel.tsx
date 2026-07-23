import { Phone, Plus, SlidersHorizontal, Tablet, Trash2, TriangleAlert, Workflow } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  COMPORTAMIENTOS_ALERTA,
  SERVICIOS_APLICABLES,
  type PreguntaEditor,
} from "@/modules/encuestas/editor-cuestionario/datos/mockEditorCuestionario"

interface ConfiguracionLogicaPanelProps {
  pregunta: PreguntaEditor
  onCambiar: <K extends keyof PreguntaEditor>(campo: K, valor: PreguntaEditor[K]) => void
  onEliminarCondicion: (condicionId: string) => void
  onAnadirCondicion: () => void
}

function CanalBoton({
  activo,
  onClick,
  icon: Icon,
  label,
}: {
  activo: boolean
  onClick: () => void
  icon: typeof Phone
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        activo
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:bg-muted/60",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export function ConfiguracionLogicaPanel({
  pregunta,
  onCambiar,
  onEliminarCondicion,
  onAnadirCondicion,
}: ConfiguracionLogicaPanelProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-base font-semibold">Configuración y Lógica</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 py-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Pregunta Obligatoria</p>
            <p className="text-xs text-muted-foreground">
              El paciente no puede avanzar sin responder.
            </p>
          </div>
          <Switch
            checked={pregunta.requerida}
            onCheckedChange={(checked) => onCambiar("requerida", checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Habilitada (Activa)</p>
            <p className="text-xs text-muted-foreground">
              Visible en los formularios actuales.
            </p>
          </div>
          <Switch
            checked={pregunta.habilitada}
            onCheckedChange={(checked) => onCambiar("habilitada", checked)}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            Criterios de Aplicación
          </h3>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Servicio Aplicable
            </Label>
            <Select
              value={pregunta.servicioAplicable}
              onValueChange={(value) => onCambiar("servicioAplicable", value)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICIOS_APLICABLES.map((servicio) => (
                  <SelectItem key={servicio} value={servicio}>
                    {servicio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Canal de Captura
            </Label>
            <div className="flex gap-2">
              <CanalBoton
                icon={Tablet}
                label="Presencial"
                activo={pregunta.canalCaptura === "presencial"}
                onClick={() => onCambiar("canalCaptura", "presencial")}
              />
              <CanalBoton
                icon={Phone}
                label="Llamada"
                activo={pregunta.canalCaptura === "llamada"}
                onClick={() => onCambiar("canalCaptura", "llamada")}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Workflow className="size-4 text-muted-foreground" />
            Lógica Condicional
          </h3>

          {pregunta.logica.condiciones.map((condicion) => (
            <div key={condicion.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground">
                  Mostrar esta pregunta <span className="font-semibold">SOLO SI:</span>
                </p>
                {pregunta.logica.activa && (
                  <Badge variant="secondary" className="shrink-0 text-[11px]">
                    Activa
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-card font-normal">
                  {condicion.variable}
                </Badge>
                <Badge variant="outline" className="bg-card font-normal">
                  {condicion.operador}
                </Badge>
                <Badge variant="outline" className="bg-card font-normal">
                  {condicion.valor}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => onEliminarCondicion(condicion.id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline"
              >
                <Trash2 className="size-3.5" />
                Eliminar regla
              </button>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full border-dashed" onClick={onAnadirCondicion}>
            <Plus data-icon="inline-start" />
            Añadir Condición
          </Button>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TriangleAlert className="size-4 text-muted-foreground" />
            Comportamiento de Alerta
          </h3>
          <Label className="text-xs font-medium text-muted-foreground">
            Si el paciente selecciona una opción negativa:
          </Label>
          <Select
            value={pregunta.comportamientoAlerta}
            onValueChange={(value) => onCambiar("comportamientoAlerta", value)}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPORTAMIENTOS_ALERTA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
