import type { DietaCatalogo } from "@/modules/dietas-cocina/types/catalog"
import { useEffect, useState } from "react"
import { AlertCircle, ArrowRight, Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerFromString } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TarifasPorComidaInputs } from "@/modules/dietas-cocina/dietas-tarifas/components/TarifasPorComidaInputs"
import {
  fechaCatalogoAISO,
  finAnioCatalogoISO,
  formatearFechaCatalogo,
  formatearFechaHoraCatalogo,
  validarSolapamientoVigencia,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"
import {
  parseTarifasPorComida,
  resolverTarifaVigenteMinima,
  TARIFAS_POR_COMIDA_VACIAS,
  tarifasPorComidaDesdeMontos,
  formatearResumenTarifas,
  type TarifasPorComidaForm,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/tarifasPorComida"
import { mapearComidaInterna } from "@/modules/dietas-cocina/api/utils"
import { cn } from "@/lib/utils"

export interface NuevaTarifaPayload {
  tarifas: Array<{ tiempoComida: string; monto: number }>
  vigenciaDesde: string
  vigenciaHasta: string
  motivoCambio: string
}

interface NuevaTarifaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dieta: DietaCatalogo | null
  onConfirmar: (
    dieta: DietaCatalogo,
    tarifa: NuevaTarifaPayload,
  ) => void | Promise<void>
}

export function NuevaTarifaSheet({
  open,
  onOpenChange,
  dieta,
  onConfirmar,
}: NuevaTarifaSheetProps) {
  const [tarifasPorComida, setTarifasPorComida] = useState<TarifasPorComidaForm>({
    ...TARIFAS_POR_COMIDA_VACIAS,
  })
  const [fechaInicio, setFechaInicio] = useState("")

  useEffect(() => {
    if (open) {
      setTarifasPorComida(tarifasPorComidaDesdeMontos(dieta?.tarifasVigentes ?? {}))
      setFechaInicio("")
    }
  }, [open, dieta?.id, dieta?.tarifasVigentes])

  if (!dieta) return null

  const solapamiento = validarSolapamientoVigencia(fechaInicio, dieta)
  const tarifasPayload = parseTarifasPorComida(tarifasPorComida)
  const tarifasValidas = tarifasPayload.length > 0

  async function confirmar() {
    if (!dieta || solapamiento.solapa || !tarifasValidas || !fechaInicio) return

    const dietaActual = dieta
    const inicio = new Date(`${fechaInicio}T12:00:00`)
    const anio = inicio.getFullYear()
    const vigenciaHastaIso = finAnioCatalogoISO(fechaInicio)
    const fin = new Date(`${vigenciaHastaIso}T12:00:00`)
    const ahora = new Date()
    const motivoCambio = "Nueva vigencia tarifaria registrada."
    const historicoActualizado = dietaActual.historicoTarifas.map((t) => {
      if (!t.vigente) return t

      const inicioExistenteIso = fechaCatalogoAISO(t.vigenciaDesde, t.anio)
      const finExistenteIso = fechaCatalogoAISO(t.vigenciaHasta, t.anio)
      if (!inicioExistenteIso || !finExistenteIso) {
        return { ...t, vigente: false }
      }

      const inicioExistente = new Date(`${inicioExistenteIso}T12:00:00`)
      const finExistente = new Date(`${finExistenteIso}T12:00:00`)

      if (inicio > inicioExistente && inicio <= finExistente) {
        const cierre = new Date(inicio)
        cierre.setDate(cierre.getDate() - 1)
        return {
          ...t,
          vigenciaHasta: formatearFechaCatalogo(cierre),
          vigente: false,
        }
      }

      return { ...t, vigente: false }
    })

    const nuevasEntradas = tarifasPayload.map((item, index) => ({
      id: `TRF-${anio}-${String(historicoActualizado.length + index + 1).padStart(2, "0")}`,
      anio,
      tiempoComida: mapearComidaInterna(item.tiempoComida),
      monto: item.monto,
      vigenciaDesde: formatearFechaCatalogo(inicio),
      vigenciaHasta: formatearFechaCatalogo(fin),
      registradoPor: "m.nutricion",
      motivoCambio,
      creadoEn: formatearFechaCatalogo(ahora),
      vigente: true,
    }))

    const tarifasVigentes = Object.fromEntries(
      nuevasEntradas.map((item) => [item.tiempoComida, item.monto]),
    ) as DietaCatalogo["tarifasVigentes"]

    try {
      await onConfirmar(
        {
          ...dietaActual,
          tarifasVigentes,
          tarifaVigente: resolverTarifaVigenteMinima(tarifasVigentes),
          estado: "vigente",
          ultimaActualizacion: formatearFechaHoraCatalogo(ahora),
          historicoTarifas: [...nuevasEntradas, ...historicoActualizado],
        },
        {
          tarifas: tarifasPayload,
          vigenciaDesde: fechaInicio,
          vigenciaHasta: vigenciaHastaIso,
          motivoCambio,
        },
      )
      onOpenChange(false)
    } catch {
      // El padre muestra el error; mantener el sheet abierto.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)]"
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
                Se creará una nueva vigencia tarifaria por tiempo de comida. Los
                registros históricos conservarán la tarifa aplicable en su fecha
                original.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="space-y-2 p-4">
                <p className="text-sm font-semibold">Transición Tarifaria</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Tarifas actuales</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="border-b-2 border-primary font-semibold text-primary">
                    Nueva vigencia
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tarifas actuales:{" "}
                  {formatearResumenTarifas(dieta.tarifasVigentes)}. El periodo
                  actual se cerrará automáticamente en la fecha de inicio de la
                  nueva tarifa.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Label>Nuevas tarifas por comida (COP)</Label>
              <TarifasPorComidaInputs
                values={tarifasPorComida}
                onChange={setTarifasPorComida}
                idPrefix="nueva-tarifa"
              />
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
            disabled={solapamiento.solapa || !tarifasValidas || !fechaInicio}
            onClick={confirmar}
          >
            Confirmar nueva vigencia
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
