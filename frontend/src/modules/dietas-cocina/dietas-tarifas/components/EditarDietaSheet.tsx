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
  onGuardar: (
    dieta: DietaCatalogo,
    fechasIso?: { fechaInicio?: string; fechaFin?: string },
  ) => void | Promise<void>
}

function dietaToForm(dieta: DietaCatalogo): DietaCatalogoFormValues {
  const tarifaVigente = dieta.historicoTarifas.find((t) => t.vigente)
  const fechaInicio =
    fechaCatalogoAISO(dieta.fechaInicio) ||
    (tarifaVigente ? fechaCatalogoAISO(tarifaVigente.vigenciaDesde) : "")
  const fechaFin = dieta.fechaFin
    ? fechaCatalogoAISO(dieta.fechaFin)
    : tarifaVigente?.vigenciaHasta
      ? fechaCatalogoAISO(tarifaVigente.vigenciaHasta)
      : ""

  return {
    codigo: dieta.codigo,
    nombre: dieta.nombre,
    descripcion: dieta.descripcion,
    tarifaInicial: String(dieta.tarifaVigente),
    fechaInicio,
    fechaFin,
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

  async function guardar() {
    if (!puedeGuardar || !dieta || !values) return

    const dietaActual = dieta
    const valuesActuales = values
    const ahora = new Date()
    const parseIso = (iso: string) => new Date(`${iso}T12:00:00`)

    try {
      await onGuardar(
        {
          ...dietaActual,
          nombre: valuesActuales.nombre.trim(),
          descripcion: valuesActuales.descripcion.trim(),
          activa: valuesActuales.activa,
          estado: valuesActuales.activa ? dietaActual.estado : "inactiva",
          fechaInicio: valuesActuales.fechaInicio
            ? formatearFechaCatalogo(parseIso(valuesActuales.fechaInicio))
            : dietaActual.fechaInicio,
          fechaFin: valuesActuales.fechaFin
            ? formatearFechaCatalogo(parseIso(valuesActuales.fechaFin))
            : null,
          ultimaActualizacion: formatearFechaHoraCatalogo(ahora),
        },
        {
          fechaInicio: valuesActuales.fechaInicio || undefined,
          fechaFin: valuesActuales.fechaFin || undefined,
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
              tarifaReadOnly
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
