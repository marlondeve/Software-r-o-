import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { HistoricoTarifasTimeline } from "@/modules/dietas-cocina/dietas-tarifas/components/HistoricoTarifasTimeline"
import type { DietaCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"

interface HistoricoTarifasSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dieta: DietaCatalogo | null
  onRegistrarNuevaTarifa: (dieta: DietaCatalogo) => void
}

export function HistoricoTarifasSheet({
  open,
  onOpenChange,
  dieta,
  onRegistrarNuevaTarifa,
}: HistoricoTarifasSheetProps) {
  if (!dieta) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)]"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Histórico de Tarifas</SheetTitle>
          <p className="text-sm text-muted-foreground">{dieta.nombre}</p>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="px-5 py-4">
            <HistoricoTarifasTimeline tarifas={dieta.historicoTarifas} />
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="shrink-0 border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false)
              onRegistrarNuevaTarifa(dieta)
            }}
          >
            <Plus className="size-4" />
            Registrar Nueva Tarifa
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
