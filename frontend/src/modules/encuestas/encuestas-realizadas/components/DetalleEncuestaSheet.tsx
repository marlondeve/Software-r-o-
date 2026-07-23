import { CloudCheck, Download, Printer, TriangleAlert, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { EstadoEncuestaBadge } from "@/modules/encuestas/encuestas-realizadas/components/EstadoEncuestaBadge"
import type {
  FilaEncuestaRealizada,
  RespuestaEncuestaDetalle,
} from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"
import { mockEncuestasRealizadas } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"
import { cn } from "@/lib/utils"

interface DetalleEncuestaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaEncuestaRealizada | null
  onAnular: (fila: FilaEncuestaRealizada) => void
}

function ValorRespuestaBadge({ respuesta }: { respuesta: RespuestaEncuestaDetalle }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
        respuesta.tono === "positivo" && "bg-primary/10 text-primary",
        respuesta.tono === "neutro" && "bg-muted text-muted-foreground",
        respuesta.tono === "negativo" && "bg-destructive/15 text-destructive",
      )}
    >
      {respuesta.valor}
    </span>
  )
}

function RespuestaCard({ respuesta }: { respuesta: RespuestaEncuestaDetalle }) {
  const negativa = respuesta.tono === "negativo"

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-3.5",
        negativa ? "border-destructive/20 bg-destructive/5" : "border-border",
      )}
    >
      <p className="flex items-start gap-2 text-sm font-medium text-foreground">
        {negativa && (
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
        )}
        <span>
          {respuesta.numero}. {respuesta.pregunta}
        </span>
      </p>

      <div className="flex items-center gap-2.5">
        <ValorRespuestaBadge respuesta={respuesta} />
        <span
          className={cn(
            "text-sm font-medium",
            negativa ? "text-destructive" : "text-foreground",
          )}
        >
          {respuesta.etiqueta}
        </span>
      </div>

      {respuesta.comentarioObligatorio && (
        <div className="rounded-md bg-card px-3 py-2.5">
          <p className="text-xs font-semibold text-foreground">Comentario Obligatorio</p>
          <p className="mt-1 text-sm text-muted-foreground italic">
            &quot;{respuesta.comentarioObligatorio}&quot;
          </p>
        </div>
      )}
    </div>
  )
}

export function DetalleEncuestaSheet({
  open,
  onOpenChange,
  fila,
  onAnular,
}: DetalleEncuestaSheetProps) {
  if (!fila) return null

  const detalle = mockEncuestasRealizadas.detalles[fila.id]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 space-y-2 border-b px-5 py-4 pr-14 text-left">
          <div className="flex items-center gap-2.5">
            <EstadoEncuestaBadge estado={fila.estado} />
            <span className="text-sm text-muted-foreground">
              ID: {detalle?.idCompleto ?? fila.consecutivo}
            </span>
          </div>
          <SheetTitle className="text-xl">{fila.paciente}</SheetTitle>
          <SheetDescription className="text-sm">{fila.documento}</SheetDescription>
        </SheetHeader>

        <ScrollAreaFlex key={fila.id}>
          <div className="space-y-5 px-5 py-4">
            <section className="space-y-3 rounded-lg border border-border p-3.5">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Información General
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Canal</p>
                  <p className="text-sm font-medium text-foreground">
                    {detalle?.canalDetalle ?? fila.canal}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Encuestador</p>
                  <p className="text-sm font-medium text-foreground">
                    {fila.encuestador}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Fecha / Hora</p>
                  <p className="text-sm font-medium text-foreground">{fila.fecha}</p>
                </div>
              </div>

              {detalle && (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">Estado Sincronización</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    <CloudCheck className="size-4" />
                    {detalle.estadoSincronizacion === "sincronizado"
                      ? "Sincronizado"
                      : detalle.estadoSincronizacion === "pendiente"
                        ? "Pendiente"
                        : "Error"}
                  </span>
                </div>
              )}
            </section>

            {detalle && detalle.respuestas.length > 0 && (
              <section className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Respuestas
                </p>
                <div className="space-y-3">
                  {detalle.respuestas.map((respuesta) => (
                    <RespuestaCard key={respuesta.numero} respuesta={respuesta} />
                  ))}
                </div>
              </section>
            )}

            {detalle && detalle.historial.length > 0 && (
              <section className="space-y-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Historial de Auditoría
                </p>
                <div className="relative ml-1 space-y-4 border-l-2 border-border pl-5">
                  {detalle.historial.map((evento, index) => (
                    <div key={`${evento.titulo}-${index}`} className="relative">
                      <span
                        className={cn(
                          "absolute top-1 -left-[1.625rem] size-3 rounded-full border-2 border-background",
                          evento.actual ? "bg-primary" : "bg-muted-foreground/60",
                        )}
                      />
                      <p className="text-sm font-medium text-foreground">
                        {evento.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">{evento.detalle}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="mx-0 mb-0 flex-row items-center justify-between gap-2 border-t bg-muted/30 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-destructive hover:text-destructive"
            disabled={fila.estado === "anulada"}
            onClick={() => onAnular(fila)}
          >
            <XCircle data-icon="inline-start" />
            Anular
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => window.alert("Imprimiendo encuesta...")}
            >
              <Printer data-icon="inline-start" />
              Imprimir
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={() => window.alert("Descargando PDF...")}
            >
              <Download data-icon="inline-start" />
              PDF
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
