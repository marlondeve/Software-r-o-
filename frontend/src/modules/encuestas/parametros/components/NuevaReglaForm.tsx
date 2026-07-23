import { useState } from "react"
import { ChevronDown, Languages, Plus, Save } from "lucide-react"

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
import {
  ACCIONES_FORMULARIO,
  ACCION_A_VERBO,
  CAMPOS_DATOS,
  OBJETIVOS_FORMULARIO,
  OPERADORES_LOGICOS,
  OPERADOR_A_TEXTO,
} from "@/modules/encuestas/parametros/datos/mockParametrosReglas"

export interface NuevaRegla {
  campoDatos: string
  operador: string
  valor: string
  accion: string
  objetivo: string
}

const REGLA_INICIAL: NuevaRegla = {
  campoDatos: "EPS del Paciente",
  operador: "Es exactamente igual a",
  valor: "Sura EPS",
  accion: "Mostrar pregunta específica",
  objetivo: "Calidad del servicio percibido",
}

function construirTraduccion(regla: NuevaRegla) {
  const verbo = ACCION_A_VERBO[regla.accion] ?? regla.accion
  const operadorTexto = OPERADOR_A_TEXTO[regla.operador] ?? regla.operador
  return { verbo, operadorTexto }
}

interface NuevaReglaFormProps {
  onGuardar: (regla: NuevaRegla) => void
  onCancelar: () => void
}

export function NuevaReglaForm({ onGuardar, onCancelar }: NuevaReglaFormProps) {
  const [regla, setRegla] = useState<NuevaRegla>(REGLA_INICIAL)

  function set<K extends keyof NuevaRegla>(campo: K, valor: NuevaRegla[K]) {
    setRegla((prev) => ({ ...prev, [campo]: valor }))
  }

  const { verbo, operadorTexto } = construirTraduccion(regla)

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Plus className="size-4" />
          </span>
          Nueva Regla Condicional
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-4 sm:px-6">
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold tracking-wide text-primary-foreground uppercase">
              Cuando
            </span>
            se cumplan las siguientes condiciones:
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Campo de Datos</Label>
              <Select value={regla.campoDatos} onValueChange={(v) => set("campoDatos", v)}>
                <SelectTrigger className="h-11 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPOS_DATOS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Operador Lógico</Label>
              <Select value={regla.operador} onValueChange={(v) => set("operador", v)}>
                <SelectTrigger className="h-11 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERADORES_LOGICOS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Valor de Referencia</Label>
              <Input
                value={regla.valor}
                onChange={(event) => set("valor", event.target.value)}
                className="h-11 bg-card"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.alert("Añadir otra condición (Y/O)")}
            className="text-sm font-medium text-primary hover:underline"
          >
            + Añadir condición (Y/O)
          </button>
        </div>

        <div className="flex justify-center">
          <span className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground">
            <ChevronDown className="size-4" />
          </span>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-bold tracking-wide text-secondary-foreground uppercase">
              Entonces
            </span>
            ejecutar la siguiente acción:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Acción en Formulario</Label>
              <Select value={regla.accion} onValueChange={(v) => set("accion", v)}>
                <SelectTrigger className="h-11 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCIONES_FORMULARIO.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Objetivo (Pregunta / Sección)
              </Label>
              <Select value={regla.objetivo} onValueChange={(v) => set("objetivo", v)}>
                <SelectTrigger className="h-11 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJETIVOS_FORMULARIO.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-primary/5 px-4 py-3.5">
          <Languages className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Traducción de la regla
            </p>
            <p className="mt-1 text-sm text-foreground">
              &quot;{verbo} <span className="font-medium text-primary">{regla.objetivo}</span>{" "}
              cuando {regla.campoDatos} {operadorTexto}{" "}
              <span className="font-medium text-primary">{regla.valor}</span>.&quot;
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" className="h-11" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="button" className="h-11" onClick={() => onGuardar(regla)}>
            <Save data-icon="inline-start" />
            Guardar Regla
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
