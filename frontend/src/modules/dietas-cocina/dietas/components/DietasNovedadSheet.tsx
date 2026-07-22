import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Info, Save, Shield, UtensilsCrossed } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  CondicionExpandible,
  ContextoPacienteCard,
  SeccionTitulo,
} from "@/modules/dietas-cocina/dietas/components/shared/dietasSheetUi"
import type { ComidaTab, FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { MOTIVOS_NOVEDAD } from "@/modules/dietas-cocina/dietas/datos/mockDetalleDieta"
import { obtenerVentanaComida } from "@/modules/dietas-cocina/dietas/lib/solicitudDieta"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { cn } from "@/lib/utils"

interface FormularioNovedad {
  comida: TiempoComida
  tipoDieta: string
  consistencia: string
  pacienteAislado: boolean
  observacionAislamiento: string
  alergico: boolean
  alergias: string
  motivo: string
  observaciones: string
}

interface DietasNovedadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaDieta | null
  comidaActiva: TiempoComida
  comidas: ComidaTab[]
  tiposDieta: string[]
  consistencias: string[]
  cierreVentanaMinutos: number
}

function crearFormularioNovedad(
  fila: FilaDieta,
  comidaActiva: TiempoComida,
): FormularioNovedad {
  return {
    comida: comidaActiva,
    tipoDieta: fila.tipoDieta ?? "",
    consistencia: fila.consistencia ?? "",
    pacienteAislado: fila.aislado ?? false,
    observacionAislamiento: fila.observacionAislamiento,
    alergico: fila.alergico,
    alergias: fila.alergias,
    motivo: "",
    observaciones: "",
  }
}

function ResumenCambio({
  etiqueta,
  anterior,
  nuevo,
}: {
  etiqueta: string
  anterior: string
  nuevo: string
}) {
  if (anterior === nuevo) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{etiqueta}:</span>
      <span className="line-through text-muted-foreground">{anterior}</span>
      <span className="text-muted-foreground">→</span>
      <span className="font-medium text-foreground">{nuevo}</span>
    </div>
  )
}

export function DietasNovedadSheet({
  open,
  onOpenChange,
  fila,
  comidaActiva,
  comidas,
  tiposDieta,
  consistencias,
  cierreVentanaMinutos,
}: DietasNovedadSheetProps) {
  const [formulario, setFormulario] = useState<FormularioNovedad | null>(null)

  useEffect(() => {
    if (fila && open) {
      setFormulario(crearFormularioNovedad(fila, comidaActiva))
    }
  }, [fila, comidaActiva, open])

  const cambios = useMemo(() => {
    if (!fila || !formulario) return []

    return [
      {
        etiqueta: "Tipo de dieta",
        anterior: fila.tipoDieta ?? "Sin asignar",
        nuevo: formulario.tipoDieta || "Sin asignar",
      },
      {
        etiqueta: "Consistencia",
        anterior: fila.consistencia ?? "Sin asignar",
        nuevo: formulario.consistencia || "Sin asignar",
      },
    ]
  }, [fila, formulario])

  if (!fila || !formulario) return null

  const ventana = obtenerVentanaComida(formulario.comida)
  const hayCambios = cambios.some((c) => c.anterior !== c.nuevo)

  function actualizarFormulario(cambios: Partial<FormularioNovedad>) {
    setFormulario((prev) => (prev ? { ...prev, ...cambios } : prev))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Registrar novedad</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {fila.paciente} · Hab {fila.habitacion}
          </p>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="w-full space-y-5 px-5 py-4">
            <Alert className="border-primary/20 bg-primary/5">
              <Info className="text-primary" />
              <AlertDescription className="text-foreground/80">
                La novedad puede registrarse dentro del horario permitido.{" "}
                Ventana: {ventana}. Cierre en {cierreVentanaMinutos} min.
              </AlertDescription>
            </Alert>

            <ContextoPacienteCard fila={fila} />

            <section className="rounded-xl border border-border bg-muted/40 p-4">
              <SeccionTitulo>Estado actual</SeccionTitulo>
              <div className="mt-3 grid gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Dieta:</span>{" "}
                  <span className="font-medium">{fila.tipoDieta ?? "—"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Consistencia:</span>{" "}
                  <span className="font-medium">{fila.consistencia ?? "—"}</span>
                </p>
                {fila.solicitadoPor && (
                  <p>
                    <span className="text-muted-foreground">Solicitante:</span>{" "}
                    <span className="font-medium">{fila.solicitadoPor}</span>
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <SeccionTitulo>Configurar cambio</SeccionTitulo>
              <div className="grid grid-cols-3 gap-2">
                {comidas.map((comida) => {
                  const activa = formulario.comida === comida.id
                  return (
                    <button
                      key={comida.id}
                      type="button"
                      onClick={() => actualizarFormulario({ comida: comida.id })}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-center text-[11px] leading-tight font-medium transition-colors",
                        activa
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {comida.label}
                    </button>
                  )
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Tipo de dieta
                  </Label>
                  <Select
                    value={formulario.tipoDieta || undefined}
                    onValueChange={(value) =>
                      actualizarFormulario({ tipoDieta: value })
                    }
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDieta.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Consistencia
                  </Label>
                  <Select
                    value={formulario.consistencia || undefined}
                    onValueChange={(value) =>
                      actualizarFormulario({ consistencia: value })
                    }
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {consistencias.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <CondicionExpandible
                id="novedad-aislado"
                icon={<Shield className="size-4 text-primary" />}
                label="Paciente aislado"
                activo={formulario.pacienteAislado}
                observacion={formulario.observacionAislamiento}
                onActivoChange={(activo) =>
                  actualizarFormulario({ pacienteAislado: activo })
                }
                onObservacionChange={(value) =>
                  actualizarFormulario({ observacionAislamiento: value })
                }
              />
              <CondicionExpandible
                id="novedad-alergico"
                icon={<AlertTriangle className="size-4 text-primary" />}
                label="Alérgico"
                activo={formulario.alergico}
                observacion={formulario.alergias}
                placeholder="Describa alergias..."
                onActivoChange={(activo) =>
                  actualizarFormulario({ alergico: activo })
                }
                onObservacionChange={(value) =>
                  actualizarFormulario({ alergias: value })
                }
              />
            </section>

            <section className="space-y-3">
              <SeccionTitulo>Motivo de la novedad</SeccionTitulo>
              <Select
                value={formulario.motivo || undefined}
                onValueChange={(value) => actualizarFormulario({ motivo: value })}
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="Seleccionar motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_NOVEDAD.map((motivo) => (
                    <SelectItem key={motivo} value={motivo}>
                      {motivo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                id="novedad-observaciones"
                value={formulario.observaciones}
                onChange={(event) =>
                  actualizarFormulario({ observaciones: event.target.value })
                }
                placeholder="Observaciones adicionales..."
                className="min-h-24 bg-card"
              />
            </section>

            {hayCambios && (
              <section className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <UtensilsCrossed className="size-4 text-muted-foreground" />
                  <SeccionTitulo>Resumen de cambios</SeccionTitulo>
                </div>
                <div className="space-y-2">
                  {cambios.map((cambio) => (
                    <ResumenCambio key={cambio.etiqueta} {...cambio} />
                  ))}
                </div>
                <Badge variant="outline" className="mt-3">
                  Pendiente de confirmación
                </Badge>
              </section>
            )}
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="mt-0 shrink-0 flex-col gap-2 border-t bg-muted/30 px-5 py-4">
          <Button type="button" className="w-full">
            <Check data-icon="inline-start" />
            Confirmar cambio
          </Button>
          <div className="flex w-full gap-2">
            <Button type="button" variant="outline" className="flex-1">
              <Save data-icon="inline-start" />
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
