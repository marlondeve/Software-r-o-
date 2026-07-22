import { useEffect, useState } from "react"
import { Headphones, IdCard, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerFromString } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { TimePicker } from "@/components/ui/time-picker"
import {
  RESULTADOS_LLAMADA,
  type FilaCapturaTelefonica,
  type ResultadoLlamada,
} from "@/modules/encuestas/captura-telefonica/datos/mockCapturaTelefonica"
import { cn } from "@/lib/utils"

export interface IntentoGuardado {
  resultado: ResultadoLlamada
  fechaReintento?: string
  horaReintento?: string
  observaciones?: string
}

interface GestionLlamadaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaCapturaTelefonica | null
  onGuardarIntento: (fila: FilaCapturaTelefonica, intento: IntentoGuardado) => void
  onIniciarEncuesta: (fila: FilaCapturaTelefonica) => void
}

function OpcionResultado({
  value,
  label,
  descripcion,
  tono,
}: {
  value: ResultadoLlamada
  label: string
  descripcion?: string
  tono?: "negativo"
}) {
  return (
    <label
      htmlFor={`resultado-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/40",
        "has-data-checked:border-primary has-data-checked:bg-primary/5",
      )}
    >
      <RadioGroupItem value={value} id={`resultado-${value}`} className="mt-0.5" />
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            tono === "negativo" ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
        </p>
        {descripcion && (
          <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>
        )}
      </div>
    </label>
  )
}

export function GestionLlamadaSheet({
  open,
  onOpenChange,
  fila,
  onGuardarIntento,
  onIniciarEncuesta,
}: GestionLlamadaSheetProps) {
  const [resultado, setResultado] = useState<ResultadoLlamada | null>(null)
  const [fechaReintento, setFechaReintento] = useState("")
  const [horaReintento, setHoraReintento] = useState<string | undefined>(undefined)
  const [observaciones, setObservaciones] = useState("")

  useEffect(() => {
    if (open) {
      setResultado(null)
      setFechaReintento("")
      setHoraReintento(undefined)
      setObservaciones("")
    }
  }, [open])

  if (!fila) return null

  const muestraReintento = resultado === "solicita_posterior"

  function guardarIntento() {
    if (!fila || !resultado) return
    onGuardarIntento(fila, {
      resultado,
      fechaReintento: muestraReintento ? fechaReintento : undefined,
      horaReintento: muestraReintento ? horaReintento : undefined,
      observaciones: observaciones.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,32rem)] data-[side=right]:max-w-32rem"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-14 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Headphones className="size-5 text-primary" />
            Gestión de Llamada
          </SheetTitle>
          <SheetDescription className="sr-only">
            Registrar el resultado de la llamada a {fila.paciente}
          </SheetDescription>
        </SheetHeader>

        <ScrollAreaFlex key={fila.id}>
          <div className="space-y-5 px-5 py-4">
            <Card className="gap-2 py-3.5 shadow-none">
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground">{fila.paciente}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IdCard className="size-3.5" />
                    {fila.documento}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Teléfono Principal
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Phone className="size-3.5 text-primary" />
                      {fila.telefono}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Fecha Atención
                    </p>
                    <p className="mt-1 text-sm text-foreground">{fila.fechaCita}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Servicio / EPS
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {fila.especialidad} - {fila.eps}
                  </p>
                </div>
              </CardContent>
            </Card>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Historial de Intentos ({fila.intentos}/{fila.intentosMax})
              </p>

              {fila.historialIntentos.length > 0 ? (
                <div className="relative ml-1 space-y-4 border-l-2 border-border pl-5">
                  {fila.historialIntentos.map((intento, index) => (
                    <div key={`${intento.resultado}-${index}`} className="relative">
                      <span
                        className={cn(
                          "absolute top-1 -left-[1.625rem] size-3 rounded-full border-2 border-background",
                          index === 0 ? "bg-destructive" : "bg-muted-foreground/60",
                        )}
                      />
                      <p className="text-sm font-medium text-foreground">
                        {intento.resultado}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {intento.fecha} - Por: {intento.gestor}
                      </p>
                      {intento.nota && (
                        <p className="mt-0.5 text-xs text-muted-foreground italic">
                          {intento.nota}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin intentos previos.</p>
              )}
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Resultado de Llamada Actual
              </p>

              <RadioGroup
                value={resultado ?? undefined}
                onValueChange={(value) => setResultado(value as ResultadoLlamada)}
              >
                <OpcionResultado
                  value="acepta_encuesta"
                  label="Contestó y acepta realizar encuesta"
                  descripcion="Inicia el flujo de la encuesta inmediatamente."
                />
                <OpcionResultado
                  value="solicita_posterior"
                  label="Solicita llamada posterior"
                  descripcion="Programa un reintento en fecha específica."
                />
                <div className="grid grid-cols-2 gap-2">
                  {RESULTADOS_LLAMADA.filter(
                    (item) =>
                      item.id !== "acepta_encuesta" && item.id !== "solicita_posterior",
                  ).map((item) => (
                    <OpcionResultado
                      key={item.id}
                      value={item.id}
                      label={item.label}
                      tono={item.tono}
                    />
                  ))}
                </div>
              </RadioGroup>
            </section>

            {muestraReintento && (
              <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Programar Reintento
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">Fecha</Label>
                    <DatePickerFromString
                      value={fechaReintento}
                      onChange={setFechaReintento}
                      placeholder="mm/dd/yyyy"
                      className="h-10 w-full bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">Hora</Label>
                    <TimePicker
                      value={horaReintento}
                      onChange={setHoraReintento}
                      className="h-10 bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Observaciones (Opcional)
                  </Label>
                  <Textarea
                    value={observaciones}
                    onChange={(event) => setObservaciones(event.target.value)}
                    placeholder="Ej. El paciente pidió que llamaran en la tarde..."
                    className="min-h-20 bg-card"
                  />
                </div>
              </section>
            )}
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="mx-0 mb-0 flex-row items-center justify-between gap-2 border-t bg-muted/30 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!resultado}
            onClick={guardarIntento}
          >
            Guardar intento
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={resultado !== "acepta_encuesta"}
            onClick={() => onIniciarEncuesta(fila)}
          >
            Iniciar Encuesta
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
