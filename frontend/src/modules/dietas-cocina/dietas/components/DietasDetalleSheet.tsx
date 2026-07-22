import { History, PencilLine } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { SeccionTitulo } from "@/modules/dietas-cocina/dietas/components/shared/dietasSheetUi"
import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  obtenerDescripcionDieta,
  obtenerTrazabilidad,
} from "@/modules/dietas-cocina/dietas/datos/mockDetalleDieta"
import { cn } from "@/lib/utils"

interface DietasDetalleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaDieta | null
  onEditar?: (fila: FilaDieta) => void
  onConfirmar?: (fila: FilaDieta) => void
}

function inicialesPaciente(nombre: string): string {
  const partes = nombre.replace(",", "").trim().split(/\s+/)
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function DietasDetalleSheet({
  open,
  onOpenChange,
  fila,
  onEditar,
  onConfirmar,
}: DietasDetalleSheetProps) {
  if (!fila) return null

  const trazabilidad = obtenerTrazabilidad(fila.id)
  const tituloDieta = fila.tipoDieta ? `Dieta ${fila.tipoDieta}` : "Sin dieta asignada"
  const descripcion =
    fila.descripcionDieta ?? obtenerDescripcionDieta(fila.tipoDieta)
  const puedeConfirmar = fila.estado === "guardado"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Detalle de Dieta</SheetTitle>
          <div className="mt-3 flex items-center gap-3">
            <Avatar className="size-10 bg-primary text-primary-foreground">
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                {inicialesPaciente(fila.paciente)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{fila.paciente}</p>
              <p className="text-sm text-muted-foreground">
                Hab {fila.habitacion} · ID:{" "}
                {fila.pacienteId.replace("PAC-", "")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="w-full space-y-5 px-5 py-4">
            <section className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <SeccionTitulo>Estado actual</SeccionTitulo>
                <div className="flex items-center gap-1.5">
                  <EstadoBadge
                    estado={fila.estado}
                    className="shrink-0 font-semibold uppercase tracking-wide"
                  />
                  {fila.estado === "guardado" && onEditar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar solicitud"
                      onClick={() => onEditar(fila)}
                    >
                      <PencilLine className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <p className="font-semibold text-foreground">{tituloDieta}</p>
                <p className="text-sm text-muted-foreground">{descripcion}</p>
                {fila.solicitadoPor && (
                  <p className="text-xs text-muted-foreground">
                    Solicitado por {fila.solicitadoPor}
                    {fila.solicitadoEn ? ` · ${fila.solicitadoEn}` : ""}
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="size-4 text-muted-foreground" />
                <SeccionTitulo>Trazabilidad</SeccionTitulo>
              </div>
              <ul className="space-y-4">
                {trazabilidad.map((evento) => (
                  <li key={evento.id} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-1.5 size-2.5 shrink-0 rounded-full",
                        evento.activo
                          ? "bg-primary"
                          : "bg-muted-foreground/35",
                      )}
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {evento.titulo}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {evento.descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.fecha}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </ScrollAreaFlex>

        {puedeConfirmar && onConfirmar && (
          <div className="shrink-0 border-t bg-muted/30 px-5 py-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => onConfirmar(fila)}
            >
              Confirmar Dieta
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
