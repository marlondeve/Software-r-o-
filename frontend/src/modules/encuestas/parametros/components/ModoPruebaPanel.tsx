import { useState } from "react"
import { CircleCheck, Eye, EyeOff, FlaskConical, Play } from "lucide-react"

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
import {
  CONTRATOS_SIMULACION,
  EPS_SIMULACION,
} from "@/modules/encuestas/parametros/datos/mockParametrosReglas"

interface ModoPruebaPanelProps {
  visiblesSiempre: string[]
  ocultasSiempre: string[]
}

export function ModoPruebaPanel({ visiblesSiempre, ocultasSiempre }: ModoPruebaPanelProps) {
  const [eps, setEps] = useState(EPS_SIMULACION[0])
  const [contrato, setContrato] = useState(CONTRATOS_SIMULACION[0])
  const [resultado, setResultado] = useState<{ eps: string } | null>({ eps: EPS_SIMULACION[0] })

  const reglaActivada = resultado?.eps === "Sura EPS"

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FlaskConical className="size-4 text-primary" />
          Modo de Prueba
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Simula las condiciones del formulario para ver qué reglas se activan y qué preguntas
          se muestran al usuario final.
        </p>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Simular: EPS</Label>
          <Select value={eps} onValueChange={setEps}>
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EPS_SIMULACION.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Simular: Contrato</Label>
          <Select value={contrato} onValueChange={setContrato}>
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRATOS_SIMULACION.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={() => setResultado({ eps })}
        >
          <Play data-icon="inline-start" />
          Ejecutar Simulación
        </Button>

        {resultado && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Resultados de Simulación
            </p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Reglas Activadas ({reglaActivada ? 1 : 0})
              </p>
              {reglaActivada ? (
                <div className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-sm text-foreground">
                    R3: Mostrar &quot;Calidad del servicio&quot; (EPS = Sura)
                  </p>
                </div>
              ) : (
                <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
                  No se activaron reglas para esta simulación.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Eye className="size-3.5" />
                  Se Mostrarán
                </p>
                <ul className="space-y-1.5 text-sm">
                  {visiblesSiempre.map((item) => (
                    <li key={item} className="text-foreground">
                      {item}
                    </li>
                  ))}
                  {reglaActivada && (
                    <li className="font-medium text-primary">Calidad del servicio</li>
                  )}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <EyeOff className="size-3.5" />
                  Ocultas
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {ocultasSiempre.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {!reglaActivada && <li>Calidad del servicio</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
