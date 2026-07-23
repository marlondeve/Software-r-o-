import { Button } from "@/components/ui/button"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DietaCatalogoForm,
} from "@/modules/dietas-cocina/dietas-tarifas/components/DietaCatalogoForm"
import {
  DIETA_CATALOGO_FORM_VACIO,
  type DietaCatalogoFormValues,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietaCatalogoFormDefaults"
import type { DietaCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import {
  formatearFechaCatalogo,
  formatearFechaHoraCatalogo,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"
import { useEffect, useState } from "react"

interface CrearDietaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardar: (dieta: DietaCatalogo) => void
  siguienteCodigo: string
}

export function CrearDietaSheet({
  open,
  onOpenChange,
  onGuardar,
  siguienteCodigo,
}: CrearDietaSheetProps) {
  const [values, setValues] = useState<DietaCatalogoFormValues>({
    ...DIETA_CATALOGO_FORM_VACIO,
    codigo: siguienteCodigo,
  })

  useEffect(() => {
    if (open) {
      setValues({ ...DIETA_CATALOGO_FORM_VACIO, codigo: siguienteCodigo })
    }
  }, [open, siguienteCodigo])

  const puedeGuardar =
    values.codigo.trim().length > 0 && values.nombre.trim().length > 0

  function guardar() {
    if (!values.codigo.trim() || !values.nombre.trim()) return

    const ahora = new Date()
    const tarifa = Number.parseFloat(values.tarifaInicial) || 0
    const anio = values.fechaInicio
      ? new Date(values.fechaInicio).getFullYear()
      : ahora.getFullYear()

    const dieta: DietaCatalogo = {
      id: `diet-cat-new-${Date.now()}`,
      codigo: values.codigo.trim(),
      nombre: values.nombre.trim(),
      descripcion: values.descripcion.trim(),
      estado: values.activa ? "vigente" : "vencida",
      tarifaVigente: tarifa,
      fechaInicio: values.fechaInicio
        ? formatearFechaCatalogo(new Date(values.fechaInicio))
        : formatearFechaCatalogo(ahora),
      fechaFin: values.fechaFin
        ? formatearFechaCatalogo(new Date(values.fechaFin))
        : null,
      ultimaActualizacion: formatearFechaHoraCatalogo(ahora),
      usuario: "m.nutricion",
      activa: values.activa,
      historicoTarifas:
        tarifa > 0
          ? [
              {
                id: `TRF-${anio}-01`,
                anio,
                monto: tarifa,
                vigenciaDesde: "01 Ene",
                vigenciaHasta: "31 Dic",
                registradoPor: "m.nutricion",
                motivoCambio: "Tarifa inicial al crear la dieta.",
                creadoEn: formatearFechaCatalogo(ahora),
                vigente: true,
              },
            ]
          : [],
    }

    onGuardar(dieta)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,32rem)]"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Crear Dieta</SheetTitle>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="px-5 py-4">
            <DietaCatalogoForm values={values} onChange={setValues} />
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
            Guardar Dieta
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
