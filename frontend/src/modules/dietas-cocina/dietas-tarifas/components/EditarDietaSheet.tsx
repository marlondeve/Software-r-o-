import type { DietaCatalogo } from "@/modules/dietas-cocina/types/catalog"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DietaCatalogoForm } from "@/modules/dietas-cocina/dietas-tarifas/components/DietaCatalogoForm"
import type { DietaCatalogoFormValues } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietaCatalogoFormDefaults"
import {
  fechaCatalogoAISO,
  formatearFechaCatalogo,
  formatearFechaHoraCatalogo,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

interface EditarDietaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dieta: DietaCatalogo | null
  onGuardar: (dieta: DietaCatalogo) => void
}

function dietaToForm(dieta: DietaCatalogo): DietaCatalogoFormValues {
  return {
    codigo: dieta.codigo,
    nombre: dieta.nombre,
    descripcion: dieta.descripcion,
    tarifaInicial: String(dieta.tarifaVigente),
    fechaInicio: fechaCatalogoAISO(dieta.fechaInicio),
    fechaFin: dieta.fechaFin ? fechaCatalogoAISO(dieta.fechaFin) : "",
    activa: dieta.activa,
  }
}

export function EditarDietaSheet({
  open,
  onOpenChange,
  dieta,
  onGuardar,
}: EditarDietaSheetProps) {
  const [values, setValues] = useState<DietaCatalogoFormValues | null>(null)

  useEffect(() => {
    if (open && dieta) setValues(dietaToForm(dieta))
  }, [open, dieta])

  if (!dieta || !values) return null

  const puedeGuardar = values.nombre.trim().length > 0

  function guardar() {
    if (!puedeGuardar || !dieta || !values) return

    const dietaActual = dieta
    const valuesActuales = values
    const ahora = new Date()
    const tarifa =
      Number.parseFloat(valuesActuales.tarifaInicial) || dietaActual.tarifaVigente
    const historicoTarifas = dietaActual.historicoTarifas.map((entrada) => {
      if (!entrada.vigente) return entrada
      return {
        ...entrada,
        monto: tarifa,
        vigenciaDesde: valuesActuales.fechaInicio
          ? formatearFechaCatalogo(new Date(valuesActuales.fechaInicio))
          : entrada.vigenciaDesde,
        vigenciaHasta: valuesActuales.fechaFin
          ? formatearFechaCatalogo(new Date(valuesActuales.fechaFin))
          : entrada.vigenciaHasta,
      }
    })

    onGuardar({
      ...dietaActual,
      nombre: valuesActuales.nombre.trim(),
      descripcion: valuesActuales.descripcion.trim(),
      activa: valuesActuales.activa,
      estado: valuesActuales.activa ? dietaActual.estado : "vencida",
      tarifaVigente: tarifa,
      fechaInicio: valuesActuales.fechaInicio
        ? formatearFechaCatalogo(new Date(valuesActuales.fechaInicio))
        : dietaActual.fechaInicio,
      fechaFin: valuesActuales.fechaFin
        ? formatearFechaCatalogo(new Date(valuesActuales.fechaFin))
        : null,
      historicoTarifas,
      ultimaActualizacion: formatearFechaHoraCatalogo(ahora),
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
          <SheetTitle>Editar Dieta</SheetTitle>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="px-5 py-4">
            <DietaCatalogoForm
              values={values}
              onChange={setValues}
              codigoReadOnly
            />
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
          <Button type="button" disabled={!puedeGuardar} onClick={guardar}>
            Guardar cambios
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
