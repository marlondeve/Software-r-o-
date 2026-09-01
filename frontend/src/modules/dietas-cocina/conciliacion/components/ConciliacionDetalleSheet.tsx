import type { DetalleConciliacion, RegistroSistema } from "@/modules/dietas-cocina/types/reconciliation"
import { AlertTriangle, CheckCircle2, Database } from "lucide-react"
import { useEffect, useState } from "react"

import { AppBrandName } from "@/components/layout/AppBrandName"
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
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { conciliacionColores } from "@/modules/dietas-cocina/conciliacion/lib/conciliacionEstilos"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { cn } from "@/lib/utils"

interface ConciliacionDetalleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detalle: DetalleConciliacion | null
  filaId: string | null
  puedeResolver: boolean
  onMarcarConciliado: (id: string, motivo: string, observaciones: string) => void
  onPendienteRevision: (id: string, motivo: string, observaciones: string) => void
}

const columnasRegistros: ColumnDef<RegistroSistema>[] = [
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => <span className="text-xs">{row.original.fecha || "—"}</span>,
  },
  {
    id: "paciente",
    header: "Paciente",
    cell: ({ row }) => (
      <div className="text-xs">
        <p>{row.original.paciente}</p>
        <p className="text-muted-foreground">
          {[row.original.pabellon, row.original.habitacion].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
    ),
  },
  {
    id: "tipo",
    header: "Tipo clínico",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.tipoClinico || "—"}</span>
    ),
  },
  {
    id: "etiqueta",
    header: "Etiqueta",
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.tieneEtiqueta === undefined
          ? "—"
          : row.original.tieneEtiqueta
            ? "Sí"
            : "No"}
      </span>
    ),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant="outline" className={conciliacionColores.okBadge}>
        <CheckCircle2 className="size-3" />
        {row.original.estadoOrden || row.original.estado || "—"}
      </Badge>
    ),
  },
]

export function ConciliacionDetalleSheet({
  open,
  onOpenChange,
  detalle,
  filaId,
  puedeResolver,
  onMarcarConciliado,
  onPendienteRevision,
}: ConciliacionDetalleSheetProps) {
  const [motivo, setMotivo] = useState("")
  const [observaciones, setObservaciones] = useState("")

  useEffect(() => {
    if (!open) {
      setMotivo("")
      setObservaciones("")
    }
  }, [open, filaId])

  if (!detalle || !filaId) return null

  function validarResolucion(): boolean {
    if (!motivo) {
      demoToast("Selecciona un motivo de ajuste.", "warning")
      return false
    }
    if (observaciones.trim().length < 10) {
      demoToast("Las observaciones deben tener al menos 10 caracteres.", "warning")
      return false
    }
    return true
  }

  const cocinaUnidades =
    detalle.cocina.unidades === null ? "—" : `${detalle.cocina.unidades} Unidades`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Detalle de conciliación</SheetTitle>
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
                Sistema vs cocina
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Database className="size-3.5 shrink-0 text-primary" />
                    Sistema <AppBrandName />
                  </div>
                  <p className="text-xl font-semibold wrap-break-word tabular-nums text-primary sm:text-2xl">
                    {detalle.sistema.unidades} Unidades
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {detalle.sistema.valor}
                  </p>
                </div>
                <div className="min-w-0 rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Planilla de cocina</p>
                  <p className="text-xl font-semibold wrap-break-word tabular-nums text-foreground sm:text-2xl">
                    {cocinaUnidades}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{detalle.cocina.valor}</p>
                </div>
              </div>
              <div
                className={cn(
                  "mt-3 rounded-lg px-3 py-2 text-sm",
                  conciliacionColores.alertaBadge,
                )}
              >
                Diferencia:{" "}
                <span className="font-semibold">{detalle.diferencia}</span>
              </div>
            </section>

            {detalle.alertas.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Alertas</h3>
                <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                  {detalle.alertas.map((alerta) => (
                    <li key={alerta} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      {alerta}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Pacientes del grupo</h3>
                <span className="shrink-0 text-xs text-muted-foreground">
                  Total: {detalle.totalRegistros}
                </span>
              </div>
              <DataTable
                columns={columnasRegistros}
                data={detalle.registros}
                className="border-0"
                emptyMessage="No hay bandejas en esta línea FCR."
              />
            </section>

            {puedeResolver && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Resolución</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="motivo-ajuste">Motivo</Label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger id="motivo-ajuste" className="w-full bg-card">
                      <SelectValue placeholder="Seleccionar motivo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tipo-distinto">
                        Tipo clínico distinto al cobrado
                      </SelectItem>
                      <SelectItem value="sin-etiqueta">Bandeja sin etiqueta</SelectItem>
                      <SelectItem value="ajuste-cantidad">Ajuste de cantidad validado</SelectItem>
                      <SelectItem value="error-planilla">Error en planilla de cocina</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="observaciones">Observaciones (mín. 10 caracteres)</Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Explique la discrepancia..."
                    className="min-h-24 bg-card"
                  />
                </div>
              </section>
            )}
          </div>
        </ScrollAreaFlex>

        {puedeResolver && (
          <SheetFooter className="mt-0 shrink-0 flex-row gap-2 border-t bg-muted/30 px-5 py-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (!validarResolucion()) return
                onPendienteRevision(filaId, motivo, observaciones)
                onOpenChange(false)
              }}
            >
              Pendiente de revisión
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (!validarResolucion()) return
                onMarcarConciliado(filaId, motivo, observaciones)
                onOpenChange(false)
              }}
            >
              Marcar como conciliado
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
