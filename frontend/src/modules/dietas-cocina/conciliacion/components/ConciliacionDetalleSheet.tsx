import { AlertTriangle, ArrowRight, CheckCircle2, Database } from "lucide-react"

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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  DataTable,
  type ColumnDef,
} from "@/components/ui/data-table"
import type {
  DetalleConciliacion,
  RegistroSistema,
} from "@/modules/dietas-cocina/conciliacion/datos/mockConciliacion"
import { conciliacionColores } from "@/modules/dietas-cocina/conciliacion/lib/conciliacionEstilos"
import { cn } from "@/lib/utils"

interface ConciliacionDetalleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detalle: DetalleConciliacion | null
}

const columnasRegistros: ColumnDef<RegistroSistema>[] = [
  {
    accessorKey: "fecha",
    header: "Fecha/Hora",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.fecha}</span>
    ),
  },
  {
    id: "paciente",
    header: "Paciente / Habitación",
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.paciente} {row.original.habitacion}
      </span>
    ),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant="outline" className={conciliacionColores.okBadge}>
        <CheckCircle2 className="size-3" />
        {row.original.estado}
      </Badge>
    ),
  },
]

export function ConciliacionDetalleSheet({
  open,
  onOpenChange,
  detalle,
}: ConciliacionDetalleSheetProps) {
  if (!detalle) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Detalle de Conciliación</SheetTitle>
          <SheetDescription>
            {detalle.titulo} ({detalle.codigo})
          </SheetDescription>
          <Badge
            variant="outline"
            className={cn("mt-2 w-fit", conciliacionColores.alertaBadge)}
          >
            <AlertTriangle className="size-3" />
            {detalle.badge}
          </Badge>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="w-full space-y-5 px-5 py-4">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Resumen de comparación
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Database className="size-3.5 shrink-0 text-primary" />
                    Sistema Bital
                  </div>
                  <p className="text-xl font-semibold wrap-break-word tabular-nums text-primary sm:text-2xl">
                    {detalle.bital.unidades} Unidades
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {detalle.bital.valor}
                  </p>
                </div>
                <div className="min-w-0 rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Factura del proveedor
                  </p>
                  <p className="text-xl font-semibold wrap-break-word tabular-nums text-foreground sm:text-2xl">
                    {detalle.proveedor.unidades} Unidades
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {detalle.proveedor.valor}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "mt-3 rounded-lg px-3 py-2 text-sm",
                  conciliacionColores.alertaBadge,
                )}
              >
                Diferencia detectada:{" "}
                <span className="font-semibold">{detalle.diferencia}</span>
              </div>
            </section>

            <section>
              <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Registros del sistema (Bital)
                </h3>
                <span className="shrink-0 text-xs text-muted-foreground">
                  Total: {detalle.totalRegistros} registros
                </span>
              </div>
              <DataTable
                columns={columnasRegistros}
                data={detalle.registros}
                className="border-0"
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver los {detalle.totalRegistros} registros
                <ArrowRight className="size-3" />
              </button>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Resolución manual
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="motivo-ajuste">Motivo de ajuste</Label>
                <Select>
                  <SelectTrigger id="motivo-ajuste" className="w-full bg-card">
                    <SelectValue placeholder="Seleccionar motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error-factura">
                      Error en factura del proveedor
                    </SelectItem>
                    <SelectItem value="ajuste-cantidad">
                      Ajuste de cantidad validado
                    </SelectItem>
                    <SelectItem value="tarifa-incorrecta">
                      Tarifa incorrecta
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="observaciones">Observaciones obligatorias</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Explique la discrepancia..."
                  className="min-h-24 bg-card"
                />
              </div>
            </section>
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="mt-0 shrink-0 flex-row gap-2 border-t bg-muted/30 px-5 py-4">
          <Button variant="outline" className="flex-1">
            Pendiente de revisión
          </Button>
          <Button className="flex-1">Marcar como Conciliado</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
