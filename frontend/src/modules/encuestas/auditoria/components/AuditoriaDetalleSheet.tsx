import { CalendarDays, Download, FileCheck, MessageSquareText, Printer, Share2, User, UserRound } from "lucide-react"

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
import { ResultadoAuditoriaBadge } from "@/modules/encuestas/auditoria/components/ResultadoAuditoriaBadge"
import type { FilaAuditoriaEncuesta } from "@/modules/encuestas/auditoria/datos/mockAuditoriaEncuestas"
import { mockAuditoriaEncuestas } from "@/modules/encuestas/auditoria/datos/mockAuditoriaEncuestas"

interface AuditoriaDetalleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaAuditoriaEncuesta | null
}

function SeccionTitulo({
  icon: Icon,
  children,
}: {
  icon: typeof User
  children: string
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </h3>
  )
}

export function AuditoriaDetalleSheet({
  open,
  onOpenChange,
  fila,
}: AuditoriaDetalleSheetProps) {
  if (!fila) return null

  const detalle = mockAuditoriaEncuestas.detalles[fila.id]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 space-y-2 border-b px-5 py-4 pr-14 text-left">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            ID Evento
          </p>
          <SheetTitle className="text-xl">{fila.idEvento}</SheetTitle>
          <SheetDescription className="sr-only">
            Detalle del evento de auditoría {fila.idEvento}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-3">
            <ResultadoAuditoriaBadge resultado={fila.resultado} />
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {fila.fecha}
            </span>
          </div>
        </SheetHeader>

        <ScrollAreaFlex key={fila.id}>
          <div className="space-y-5 px-5 py-4">
            <section className="space-y-2">
              <SeccionTitulo icon={User}>Información del Actor</SeccionTitulo>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border p-3.5">
                <div>
                  <p className="text-xs text-muted-foreground">Usuario</p>
                  <p className="text-sm font-medium text-foreground">
                    {fila.usuarioNombre}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rol</p>
                  <p className="text-sm font-medium text-foreground">{fila.usuarioRol}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IP Origen</p>
                  <p className="text-sm font-medium text-foreground">{fila.origenIp}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dispositivo</p>
                  <p className="text-sm font-medium text-foreground">
                    {fila.origenDispositivo}
                  </p>
                </div>
              </div>
            </section>

            {detalle && detalle.contexto.length > 0 && (
              <section className="space-y-2">
                <SeccionTitulo icon={Share2}>Contexto Relacionado</SeccionTitulo>
                <div className="space-y-2">
                  {detalle.contexto.map((item) => {
                    const Icon = item.tipo === "encuesta" ? FileCheck : UserRound
                    return (
                      <div
                        key={item.titulo}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.titulo}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.subtitulo}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 shrink-0 text-primary hover:text-primary"
                          onClick={() => window.alert(`Ver ${item.titulo}`)}
                        >
                          Ver
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {detalle?.modificacion && (
              <section className="space-y-2">
                <SeccionTitulo icon={FileCheck}>
                  Detalle de Modificación (Regla Condicional)
                </SeccionTitulo>
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="bg-destructive/10 px-3.5 py-3">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-destructive uppercase">
                      − Valor Anterior
                    </p>
                    <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground">
                      {detalle.modificacion.valorAnterior}
                    </pre>
                  </div>
                  <div className="bg-primary/10 px-3.5 py-3">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-primary uppercase">
                      + Valor Nuevo
                    </p>
                    <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground">
                      {detalle.modificacion.valorNuevo}
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {detalle?.motivo && (
              <section className="space-y-2">
                <SeccionTitulo icon={MessageSquareText}>
                  Motivo (Proporcionado por el usuario)
                </SeccionTitulo>
                <blockquote className="rounded-lg border-l-4 border-primary bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground">
                  &quot;{detalle.motivo}&quot;
                </blockquote>
              </section>
            )}
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="mt-0 shrink-0 flex-row justify-end gap-2 border-t bg-muted/30 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => window.alert("Exportando JSON...")}
          >
            <Download data-icon="inline-start" />
            Exportar JSON
          </Button>
          <Button
            type="button"
            className="h-11"
            onClick={() => window.alert("Imprimiendo reporte...")}
          >
            <Printer data-icon="inline-start" />
            Imprimir Reporte
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
