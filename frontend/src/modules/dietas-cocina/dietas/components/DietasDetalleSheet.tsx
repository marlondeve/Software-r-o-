import type { EventoTrazabilidad, FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { History, PencilLine } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SheetDetailSkeleton } from "@/components/shared/skeletons"
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
  const detalleCargadoIdRef = useRef<string | null>(null)

  const filaId = fila?.id
  const pacienteId = fila?.pacienteId

  // Carga historial/detalle solo al abrir o cambiar de fila (no en cada sync de censo).
  useEffect(() => {
    if (!open || !filaId) {
      detalleCargadoIdRef.current = null
      setTrazabilidad([])
      setDetalle(null)
      setDietasPaciente([])
      setCargandoDetalle(false)
      return
    }

    let cancelado = false
    const yaCargado = detalleCargadoIdRef.current === filaId
    setDetalle((prev) => (prev?.id === filaId ? prev : (fila ?? null)))
    setCargandoDetalle(Boolean(cargarDetalle) && !yaCargado)

    if (cargarDetalle) {
      void cargarDetalle(filaId)
        .then((actualizada) => {
          if (!cancelado) {
            detalleCargadoIdRef.current = filaId
            setDetalle(actualizada)
          }
        })
        .catch(() => {
          if (!cancelado && fila) setDetalle(fila)
        })
        .finally(() => {
          if (!cancelado) setCargandoDetalle(false)
        })
    } else if (fila) {
      detalleCargadoIdRef.current = filaId
      setDetalle(fila)
      setCargandoDetalle(false)
    }

    if (cargarHistorial) {
      void cargarHistorial(filaId)
        .then((eventos) => {
          if (!cancelado) setTrazabilidad(eventos)
        })
        .catch(() => {
          if (!cancelado) setTrazabilidad(obtenerTrazabilidad(filaId))
        })
    } else {
      setTrazabilidad(obtenerTrazabilidad(filaId))
    }

    if (cargarDietasPaciente && pacienteId) {
      void cargarDietasPaciente(pacienteId)
        .then((lista) => {
          if (!cancelado) setDietasPaciente(lista)
        })
        .catch(() => {
          if (!cancelado) setDietasPaciente([])
        })
    } else {
      setDietasPaciente([])
    }

    return () => {
      cancelado = true
    }
    // Intencional: no depender de `fila` completo — el censo lo renueva cada ~15s.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filaId/pacienteId bastan
  }, [open, filaId, pacienteId, cargarHistorial, cargarDetalle, cargarDietasPaciente])

  // Refresca datos visibles del censo sin recargar historial ni mostrar skeleton.
  useEffect(() => {
    if (!open || !fila) return
    setDetalle((prev) => {
      if (!prev || prev.id !== fila.id) return prev
      if (
        prev.estado === fila.estado &&
        prev.tipoDieta === fila.tipoDieta &&
        prev.consistencia === fila.consistencia &&
        (fila.descripcionDieta == null ||
          prev.descripcionDieta === fila.descripcionDieta) &&
        (fila.solicitadoPor == null || prev.solicitadoPor === fila.solicitadoPor) &&
        (fila.solicitadoEn == null || prev.solicitadoEn === fila.solicitadoEn)
      ) {
        return prev
      }
      return {
        ...prev,
        estado: fila.estado,
        tipoDieta: fila.tipoDieta,
        consistencia: fila.consistencia,
        descripcionDieta: fila.descripcionDieta ?? prev.descripcionDieta,
        solicitadoPor: fila.solicitadoPor ?? prev.solicitadoPor,
        solicitadoEn: fila.solicitadoEn ?? prev.solicitadoEn,
      }
    })
  }, [open, fila])

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
            {cargandoDetalle ? (
              <SheetDetailSkeleton />
            ) : (
              <>
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
              </>
            )}
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
