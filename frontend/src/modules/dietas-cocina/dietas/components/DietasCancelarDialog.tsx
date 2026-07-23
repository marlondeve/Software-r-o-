import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, X, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { SeccionTitulo } from "@/modules/dietas-cocina/dietas/components/shared/dietasSheetUi"
import type { ComidaTab, FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  mockCancelarDieta,
  MOTIVOS_CANCELACION,
  type MotivoCancelacionId,
} from "@/modules/dietas-cocina/dietas/datos/mockCancelarDieta"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { esCancelacionTardia } from "@/modules/dietas-cocina/dietas/lib/solicitudDieta"
import { cn } from "@/lib/utils"

interface DietasCancelarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaDieta | null
  comidaActiva: TiempoComida
  comidas: ComidaTab[]
  onConfirmar?: (
    fila: FilaDieta,
    motivo: MotivoCancelacionId,
    justificacion: string,
  ) => void
}

export function DietasCancelarDialog({
  open,
  onOpenChange,
  fila,
  comidaActiva,
  comidas,
  onConfirmar,
}: DietasCancelarDialogProps) {
  const [motivo, setMotivo] = useState<MotivoCancelacionId>("otro")
  const [justificacion, setJustificacion] = useState("")
  const [aceptaFacturacion, setAceptaFacturacion] = useState(false)

  useEffect(() => {
    if (open) {
      setMotivo("otro")
      setJustificacion("")
      setAceptaFacturacion(false)
    }
  }, [open, fila?.id])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onOpenChange])

  if (!open || !fila) return null

  const comidaLabel =
    comidas.find((c) => c.id === comidaActiva)?.label ?? "Almuerzo"
  const config = mockCancelarDieta
  const cancelacionTardia = esCancelacionTardia(fila)
  const requiereAceptacion = cancelacionTardia && !aceptaFacturacion
  const puedeConfirmar =
    motivo.length > 0 &&
    justificacion.trim().length > 0 &&
    !requiereAceptacion

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-dieta-titulo"
        className="relative grid max-h-[min(100dvh-2rem,720px)] w-full max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="space-y-3 border-b px-6 py-4 pr-14">
          <h2
            id="cancelar-dieta-titulo"
            className="flex items-center gap-2 text-base font-semibold text-destructive"
          >
            <AlertTriangle className="size-5 shrink-0" />
            Cancelar dieta
          </h2>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {fila.paciente} · ID: {fila.pacienteId.replace("PAC-", "")} · Hab:{" "}
              {fila.habitacion}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-primary/5 font-normal text-primary"
              >
                {comidaLabel}
              </Badge>
              {fila.tipoDieta && (
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/30 bg-primary/5 font-normal text-primary"
                >
                  Dieta {fila.tipoDieta}
                </Badge>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3"
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
          </Button>
        </header>

        <div className="min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-5 px-6 py-5 pr-4">
              {cancelacionTardia && (
                <div className="space-y-3.5 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
                  <p className="text-sm leading-relaxed text-destructive">
                    {config.avisoCancelacionTardia}
                  </p>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acepta-facturacion"
                      checked={aceptaFacturacion}
                      onCheckedChange={(checked) =>
                        setAceptaFacturacion(checked === true)
                      }
                      className="mt-0.5 border-destructive/40 data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
                    />
                    <Label
                      htmlFor="acepta-facturacion"
                      className="cursor-pointer text-sm font-normal leading-snug text-destructive"
                    >
                      {config.aceptacionFacturacion}
                    </Label>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <SeccionTitulo>Motivo de cancelación</SeccionTitulo>
                <RadioGroup
                  value={motivo}
                  onValueChange={(value) =>
                    setMotivo(value as MotivoCancelacionId)
                  }
                  className="grid grid-cols-2 gap-2.5"
                >
                  {MOTIVOS_CANCELACION.map((item) => (
                    <Label
                      key={item.id}
                      htmlFor={`motivo-${item.id}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-3 text-sm font-normal transition-colors",
                        motivo === item.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/40",
                      )}
                    >
                      <RadioGroupItem
                        id={`motivo-${item.id}`}
                        value={item.id}
                      />
                      {item.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Justificación técnica{" "}
                  <span className="text-destructive">(Requerida)</span>
                </p>
                <Textarea
                  id="justificacion-cancelacion"
                  value={justificacion}
                  onChange={(event) => setJustificacion(event.target.value)}
                  placeholder={
                    cancelacionTardia
                      ? "Detalle el motivo específico de la cancelación extemporánea..."
                      : "Detalle el motivo específico de la cancelación..."
                  }
                  className="min-h-24 resize-none bg-card"
                />
              </div>

              <div className="grid gap-3 border-t border-border/60 pt-4 text-sm sm:grid-cols-2">
                <p className="text-muted-foreground">
                  Responsable:{" "}
                  <span className="font-medium text-foreground">
                    {config.responsable}
                  </span>
                </p>
                <p className="text-muted-foreground sm:text-right">
                  Fecha y hora:{" "}
                  <span className="font-medium text-foreground">
                    {config.fechaHora}
                  </span>
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t bg-muted/30 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-w-28"
            onClick={() => onOpenChange(false)}
          >
            Volver
          </Button>
          <Button
            type="button"
            size="lg"
            className={cn(
              "min-w-44 bg-destructive text-destructive-foreground hover:bg-destructive/90",
              "disabled:bg-destructive/50 disabled:text-destructive-foreground disabled:opacity-100",
            )}
            disabled={!puedeConfirmar}
            onClick={() => onConfirmar?.(fila, motivo, justificacion.trim())}
          >
            <X data-icon="inline-start" />
            Confirmar cancelación
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
