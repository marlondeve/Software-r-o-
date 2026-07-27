import type { EventoTrazabilidad, FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { History, PencilLine } from "lucide-react"
import { useEffect, useState } from "react"

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
import {
  tituloTipoDieta,
} from "@/modules/dietas-cocina/dietas/lib/dietasDetalleUi"
import {
  obtenerDescripcionDieta,
  obtenerTrazabilidad,
} from "@/modules/dietas-cocina/dietas/datos/mockDetalleDieta"
import { formatearIdentificacionPaciente } from "@/modules/dietas-cocina/lib/mapearAtencionHospitalariaAFilaDieta"
import { labelComida } from "@/modules/dietas-cocina/parametros/lib/formatearTurnoOperativo"
import { cn } from "@/lib/utils"

interface DietasDetalleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaDieta | null
  resolverEstadoVisible?: (fila: FilaDieta) => EstadoDieta
  onEditar?: (fila: FilaDieta) => void
  onConfirmar?: (fila: FilaDieta) => void
  cargarHistorial?: (filaId: string) => Promise<EventoTrazabilidad[]>
  cargarDetalle?: (filaId: string) => Promise<FilaDieta>
  cargarDietasPaciente?: (pacienteId: string) => Promise<FilaDieta[]>
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
  resolverEstadoVisible,
  onEditar,
  onConfirmar,
  cargarHistorial,
  cargarDetalle,
  cargarDietasPaciente,
}: DietasDetalleSheetProps) {
  const [trazabilidad, setTrazabilidad] = useState<EventoTrazabilidad[]>([])
  const [detalle, setDetalle] = useState<FilaDieta | null>(null)
  const [dietasPaciente, setDietasPaciente] = useState<FilaDieta[]>([])
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    if (!open || !fila) {
      setTrazabilidad([])
      setDetalle(null)
      setDietasPaciente([])
      return
    }

    setCargandoDetalle(Boolean(cargarDetalle))
    if (cargarDetalle) {
      void cargarDetalle(fila.id)
        .then((actualizada) => setDetalle(actualizada))
        .catch(() => setDetalle(fila))
        .finally(() => setCargandoDetalle(false))
    } else {
      setDetalle(fila)
    }

    if (cargarHistorial) {
      void cargarHistorial(fila.id)
        .then(setTrazabilidad)
        .catch(() => setTrazabilidad(obtenerTrazabilidad(fila.id)))
    } else {
      setTrazabilidad(obtenerTrazabilidad(fila.id))
    }

    if (cargarDietasPaciente) {
      void cargarDietasPaciente(fila.pacienteId)
        .then(setDietasPaciente)
        .catch(() => setDietasPaciente([]))
    } else {
      setDietasPaciente([])
    }
  }, [open, fila, cargarHistorial, cargarDetalle, cargarDietasPaciente])

  if (!fila) return null
  const filaMostrada = detalle ?? fila
  const estadoVisible =
    resolverEstadoVisible?.(filaMostrada) ?? filaMostrada.estado
  const tituloDieta = tituloTipoDieta(filaMostrada.tipoDieta)
  const descripcion =
    filaMostrada.descripcionDieta ?? obtenerDescripcionDieta(filaMostrada.tipoDieta)
  const puedeConfirmar = filaMostrada.estado === "guardado"
  const otrasDietasPaciente = dietasPaciente.filter(
    (item) => item.id !== filaMostrada.id,
  )

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
                {inicialesPaciente(filaMostrada.paciente)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{filaMostrada.paciente}</p>
              <p className="text-sm text-muted-foreground">
                {formatearIdentificacionPaciente(filaMostrada)}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="w-full space-y-5 px-5 py-4">
            {cargandoDetalle && (
              <p className="text-sm text-muted-foreground">Actualizando detalle…</p>
            )}
            <section className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <SeccionTitulo>Estado actual</SeccionTitulo>
                <div className="flex items-center gap-1.5">
                  <EstadoBadge
                    estado={estadoVisible}
                    className="shrink-0 font-semibold uppercase tracking-wide"
                  />
                  {filaMostrada.estado === "guardado" && onEditar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar solicitud"
                      onClick={() => onEditar(filaMostrada)}
                    >
                      <PencilLine className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <p className="font-semibold text-foreground">{tituloDieta}</p>
                <p className="text-sm text-muted-foreground">{descripcion}</p>
                {filaMostrada.solicitadoPor && (
                  <p className="text-xs text-muted-foreground">
                    Solicitado por {filaMostrada.solicitadoPor}
                    {filaMostrada.solicitadoEn ? ` · ${filaMostrada.solicitadoEn}` : ""}
                  </p>
                )}
              </div>
            </section>

            {otrasDietasPaciente.length > 0 && (
              <section className="space-y-2">
                <SeccionTitulo>Otras dietas del paciente hoy</SeccionTitulo>
                <ul className="space-y-2">
                  {otrasDietasPaciente.map((item) => {
                    const estadoItem =
                      resolverEstadoVisible?.(item) ?? item.estado
                    return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{labelComida(item.comida)}</span>
                      <EstadoBadge estado={estadoItem} className="text-[10px]" />
                    </li>
                    )
                  })}
                </ul>
              </section>
            )}

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
              onClick={() => onConfirmar(filaMostrada)}
            >
              Confirmar Dieta
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
