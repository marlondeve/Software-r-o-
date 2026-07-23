import { useEffect, useState } from "react"
import { AlertCircle, ArrowRight, Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerFromString } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { DietaCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import {
  formatearFechaCatalogo,
  formatearFechaHoraCatalogo,
  formatearMonedaTarifa,
  validarSolapamientoVigencia,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"
import { cn } from "@/lib/utils"

interface NuevaTarifaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dieta: DietaCatalogo | null
  onConfirmar: (dieta: DietaCatalogo) => void
}

export function NuevaTarifaSheet({
  open,
  onOpenChange,
  dieta,
  onConfirmar,
}: NuevaTarifaSheetProps) {
  const [monto, setMonto] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")

  useEffect(() => {
    if (open) {
      setMonto("")
      setFechaInicio("")
    }
  }, [open, dieta?.id])

  if (!dieta) return null

  const solapamiento = validarSolapamientoVigencia(fechaInicio, dieta)
  const montoNum = Number.parseFloat(monto) || 0

  function confirmar() {
    if (solapamiento.solapa || montoNum <= 0 || !fechaInicio) return

    const anio = new Date(fechaInicio).getFullYear()
    const ahora = new Date()
    const historicoActualizado = dieta.historicoTarifas.map((t) => ({
      ...t,
      vigente: false,
    }))

    const nuevaEntrada = {
      id: `TRF-${anio}-${String(historicoActualizado.length + 1).padStart(2, "0")}`,
      anio,
      monto: montoNum,
      vigenciaDesde: formatearFechaCatalogo(new Date(fechaInicio)),
      vigenciaHasta: "31 Dic",
      registradoPor: "m.nutricion",
      motivoCambio: "Nueva vigencia tarifaria registrada.",
      creadoEn: formatearFechaCatalogo(ahora),
      vigente: true,
    }

    onConfirmar({
      ...dieta,
      tarifaVigente: montoNum,
      estado: "vigente",
      fechaInicio: formatearFechaCatalogo(new Date(fechaInicio)),
      ultimaActualizacion: formatearFechaHoraCatalogo(ahora),
      historicoTarifas: [nuevaEntrada, ...historicoActualizado],
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,32rem)]"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Crear nueva tarifa</SheetTitle>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="space-y-4 px-5 py-4">
            {solapamiento.solapa && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Error de validación</AlertTitle>
                <AlertDescription>
                  No se puede crear la tarifa. Se han detectado conflictos de
                  fechas que deben corregirse antes de continuar.
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <Info className="size-4" />
              <AlertTitle>Atención</AlertTitle>
              <AlertDescription>
                Se creará una nueva vigencia tarifaria. Los registros
                históricos conservarán la tarifa aplicable en su fecha original.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="space-y-2 p-4">
                <p className="text-sm font-semibold">Transición Tarifaria</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Tarifa Actual</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="border-b-2 border-primary font-semibold text-primary">
                    Nueva Vigencia
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tarifa actual: {formatearMonedaTarifa(dieta.tarifaVigente)}.
                  El periodo actual se cerrará automáticamente en la fecha de
                  inicio de la nueva tarifa.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="nueva-tarifa-monto">Nueva tarifa (COP)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="nueva-tarifa-monto"
                  className="pl-7"
                  placeholder="0"
                  inputMode="numeric"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nueva-tarifa-fecha">
                Fecha de inicio de nueva vigencia
              </Label>
              <DatePickerFromString
                id="nueva-tarifa-fecha"
                value={fechaInicio}
                onChange={setFechaInicio}
                placeholder="Seleccionar fecha de inicio"
                className={cn(
                  "bg-card",
                  solapamiento.solapa &&
                    "border-destructive focus-visible:ring-destructive/30",
                )}
              />
              {solapamiento.solapa && solapamiento.rangoConflicto && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  El período ingresado se superpone con una vigencia existente (
                  {solapamiento.rangoConflicto}).
                </p>
              )}
            </div>
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={solapamiento.solapa || montoNum <= 0 || !fechaInicio}
            onClick={confirmar}
          >
            Confirmar nueva vigencia
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
