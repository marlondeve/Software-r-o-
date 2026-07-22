import { useEffect, useState, type ReactNode } from "react"
import { AlertTriangle, CheckCircle2, CircleDot, Shield } from "lucide-react"

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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import type { ComidaTab, FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  esSolicitudEditable,
  formatearContextoPaciente,
  obtenerVentanaComida,
  tituloSolicitudDieta,
} from "@/modules/dietas-cocina/dietas/lib/solicitudDieta"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { cn } from "@/lib/utils"

interface FormularioSolicitud {
  comida: TiempoComida
  tipoDieta: string
  consistencia: string
  pacienteAislado: boolean
  alergico: boolean
  alergias: string
  observacionAislamiento: string
  observaciones: string
}

interface DietasSolicitudSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaDieta | null
  comidaInicial: TiempoComida
  comidas: ComidaTab[]
  tiposDieta: string[]
  consistencias: string[]
  cierreVentanaMinutos: number
}

function crearFormularioDesdeFila(
  fila: FilaDieta,
  comidaInicial: TiempoComida,
): FormularioSolicitud {
  return {
    comida: comidaInicial,
    tipoDieta: fila.tipoDieta ?? "",
    consistencia: fila.consistencia ?? "",
    pacienteAislado: fila.aislado ?? false,
    alergico: fila.alergico,
    alergias: fila.alergias,
    observacionAislamiento: fila.observacionAislamiento,
    observaciones: fila.observaciones,
  }
}

function SeccionTitulo({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  )
}

interface CondicionExpandibleProps {
  id: string
  icon: ReactNode
  label: string
  activo: boolean
  observacion: string
  placeholder?: string
  disabled?: boolean
  onActivoChange: (activo: boolean) => void
  onObservacionChange: (value: string) => void
}

function CondicionExpandible({
  id,
  icon,
  label,
  activo,
  observacion,
  placeholder = "Describa observación...",
  disabled,
  onActivoChange,
  onObservacionChange,
}: CondicionExpandibleProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <Label htmlFor={id} className="font-medium">
            {label}
          </Label>
        </div>
        <Switch
          id={id}
          checked={activo}
          onCheckedChange={onActivoChange}
          disabled={disabled}
          className="data-[state=checked]:bg-lime-500"
        />
      </div>
      {activo && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <Label
            htmlFor={`${id}-observacion`}
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Observación
          </Label>
          <Textarea
            id={`${id}-observacion`}
            value={observacion}
            onChange={(event) => onObservacionChange(event.target.value)}
            placeholder={placeholder}
            className="min-h-20 bg-background shadow-none"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}

export function DietasSolicitudSheet({
  open,
  onOpenChange,
  fila,
  comidaInicial,
  comidas,
  tiposDieta,
  consistencias,
  cierreVentanaMinutos,
}: DietasSolicitudSheetProps) {
  const [formulario, setFormulario] = useState<FormularioSolicitud | null>(null)

  useEffect(() => {
    if (fila && open) {
      setFormulario(crearFormularioDesdeFila(fila, comidaInicial))
    }
  }, [fila, comidaInicial, open])

  if (!fila || !formulario) return null

  const editable = esSolicitudEditable(fila)
  const ventana = obtenerVentanaComida(formulario.comida)

  function actualizarFormulario(cambios: Partial<FormularioSolicitud>) {
    setFormulario((prev) => (prev ? { ...prev, ...cambios } : prev))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>{tituloSolicitudDieta(fila)}</SheetTitle>
          <SheetDescription>
            {fila.paciente} | ID: {fila.pacienteId.replace("PAC-", "")}
          </SheetDescription>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="w-full space-y-5 px-5 py-4">
            <section className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <SeccionTitulo>Contexto del paciente</SeccionTitulo>
                <EstadoBadge
                  estado={fila.estado}
                  className="shrink-0 font-semibold uppercase tracking-wide"
                />
              </div>
              <div className="mt-3 space-y-1">
                <p className="font-semibold text-foreground">
                  {fila.paciente} ({fila.edad} años)
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatearContextoPaciente(fila)}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <SeccionTitulo>Tiempo de comida</SeccionTitulo>
              <div className="grid grid-cols-3 gap-2">
                {comidas.map((comida) => {
                  const activa = formulario.comida === comida.id
                  return (
                    <button
                      key={comida.id}
                      type="button"
                      disabled={!editable}
                      onClick={() => actualizarFormulario({ comida: comida.id })}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-center text-[11px] leading-tight font-medium transition-colors",
                        activa
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                        !editable && "cursor-default opacity-80",
                      )}
                    >
                      {comida.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Ventana: {ventana}
                </span>
                <span className="font-medium text-destructive">
                  Cierre en: {cierreVentanaMinutos} min
                </span>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="tipo-dieta"
                  className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Tipo de dieta
                </Label>
                <Select
                  value={formulario.tipoDieta || undefined}
                  onValueChange={(value) =>
                    actualizarFormulario({ tipoDieta: value })
                  }
                  disabled={!editable}
                >
                  <SelectTrigger id="tipo-dieta" className="w-full bg-card">
                    <SelectValue placeholder="Seleccionar tipo..." />
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
                <Label
                  htmlFor="consistencia"
                  className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Consistencia
                </Label>
                <Select
                  value={formulario.consistencia || undefined}
                  onValueChange={(value) =>
                    actualizarFormulario({ consistencia: value })
                  }
                  disabled={!editable}
                >
                  <SelectTrigger id="consistencia" className="w-full bg-card">
                    <SelectValue placeholder="Seleccionar consistencia..." />
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
            </section>

            <section className="space-y-3">
              <CondicionExpandible
                id="paciente-aislado"
                icon={<Shield className="size-4 text-primary" />}
                label="Paciente aislado"
                activo={formulario.pacienteAislado}
                observacion={formulario.observacionAislamiento}
                disabled={!editable}
                onActivoChange={(activo) =>
                  actualizarFormulario({ pacienteAislado: activo })
                }
                onObservacionChange={(value) =>
                  actualizarFormulario({ observacionAislamiento: value })
                }
              />

              <CondicionExpandible
                id="alergico"
                icon={<AlertTriangle className="size-4 text-primary" />}
                label="Alérgico"
                activo={formulario.alergico}
                observacion={formulario.alergias}
                placeholder="Describa alergias..."
                disabled={!editable}
                onActivoChange={(activo) =>
                  actualizarFormulario({ alergico: activo })
                }
                onObservacionChange={(value) =>
                  actualizarFormulario({ alergias: value })
                }
              />
            </section>

            <section className="space-y-1.5">
              <Label
                htmlFor="observaciones"
                className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
              >
                Observaciones
              </Label>
              <Textarea
                id="observaciones"
                value={formulario.observaciones}
                onChange={(event) =>
                  actualizarFormulario({ observaciones: event.target.value })
                }
                placeholder="Notas para preparación o entrega..."
                className="min-h-24 bg-card"
                disabled={!editable}
              />
            </section>
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="mt-0 shrink-0 flex-col gap-3 border-t bg-muted/30 px-5 py-4">
          {editable ? (
            <Button type="button" className="w-full">
              Guardar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          )}

          <div className="flex w-full flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CircleDot className="size-3.5 text-amber-500" />
              <span>
                <span className="font-medium text-foreground">Guardado:</span>{" "}
                No visible para cocina.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-primary" />
              <span>
                <span className="font-medium text-foreground">Confirmado:</span>{" "}
                Visible inmediatamente para producción.
              </span>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
