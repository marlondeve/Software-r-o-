import type { ComponentType, ReactNode } from "react"
import {
  AlertTriangle,
  Globe,
  Laptop,
  Printer,
  Server,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import type { DetalleAuditoria } from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"
import {
  avatarColorPorIniciales,
  impactoNivelColor,
} from "@/modules/dietas-cocina/auditoria/lib/auditoriaEstilos"
import { cn } from "@/lib/utils"

interface AuditoriaDetalleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detalle: DetalleAuditoria | null
}

function MetadatoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 bg-background px-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

function SeccionTitulo({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground">{children}</h3>
  )
}

export function AuditoriaDetalleSheet({
  open,
  onOpenChange,
  detalle,
}: AuditoriaDetalleSheetProps) {
  if (!detalle) return null

  const muestraForense =
    detalle.parametro && detalle.valorAnterior && detalle.valorNuevo

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b px-5 py-4 pr-12 text-left">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Registro de auditoría
          </p>
          <SheetTitle className="text-lg">{detalle.codigoAuditoria}</SheetTitle>
          <SheetDescription className="sr-only">
            Detalle forense del registro {detalle.codigoAuditoria}
          </SheetDescription>
        </SheetHeader>

        <ScrollAreaFlex key={detalle.codigoAuditoria}>
          <div className="space-y-4 px-5 py-4">
            <section className="flex items-start gap-3 border-b border-border pb-4">
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback
                  className={avatarColorPorIniciales(detalle.usuario.iniciales)}
                >
                  {detalle.usuario.iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">
                  {detalle.usuario.nombre}
                </p>
                <p className="text-sm text-muted-foreground">
                  {detalle.usuario.area}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {detalle.fechaHora}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Entidad afectada
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {detalle.entidad.etiqueta}
                </p>
                {detalle.entidad.estado && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary uppercase"
                  >
                    {detalle.entidad.estado}
                  </Badge>
                )}
              </div>
            </section>

            {detalle.mensajeError && (
              <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="mb-1.5 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  <p className="text-sm font-semibold">Operación fallida</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {detalle.mensajeError}
                </p>
              </section>
            )}

            {muestraForense && (
              <section className="space-y-2">
                <SeccionTitulo>Análisis forense del cambio</SeccionTitulo>
                <p className="text-xs text-muted-foreground">
                  Parámetro:{" "}
                  <span className="font-medium text-foreground">
                    {detalle.parametro}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Valor anterior
                    </p>
                    <p className="text-sm leading-snug text-muted-foreground line-through">
                      {detalle.valorAnterior}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Valor nuevo
                    </p>
                    <p className="text-sm leading-snug font-semibold text-primary">
                      {detalle.valorNuevo}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {detalle.justificacion && (
              <section className="space-y-2">
                <SeccionTitulo>Justificación del usuario</SeccionTitulo>
                <blockquote className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 font-serif text-sm leading-relaxed text-muted-foreground italic">
                  &ldquo;{detalle.justificacion}&rdquo;
                </blockquote>
              </section>
            )}

            {detalle.impacto && (
              <section className="space-y-2">
                <SeccionTitulo>Evaluación de impacto</SeccionTitulo>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Riesgo clínico
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          impactoNivelColor[detalle.impacto.riesgoClinicoNivel],
                        )}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {detalle.impacto.riesgoClinico}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Impacto tarifa
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          impactoNivelColor[detalle.impacto.impactoTarifaNivel],
                        )}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {detalle.impacto.impactoTarifa}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-2">
              <SeccionTitulo>Metadatos técnicos</SeccionTitulo>
              <div className="space-y-2">
                <MetadatoItem
                  icon={Globe}
                  label="Dirección IP"
                  value={detalle.metadatos.ip}
                />
                <MetadatoItem
                  icon={Laptop}
                  label="Dispositivo"
                  value={detalle.metadatos.dispositivo}
                />
                <MetadatoItem
                  icon={Server}
                  label="Sistema origen"
                  value={detalle.metadatos.sistema}
                />
              </div>
            </section>

            {detalle.historial.length > 0 && (
              <section className="space-y-3 pb-1">
                <SeccionTitulo>
                  Historial reciente
                  {!detalle.usuario.esSistema && " (Paciente)"}
                </SeccionTitulo>
                <div className="relative ml-1 space-y-4 border-l-2 border-border pl-5">
                  {detalle.historial.map((evento, index) => (
                    <div key={`${evento.titulo}-${index}`} className="relative">
                      <span
                        className={cn(
                          "absolute top-1 -left-1.625rem size-3 rounded-full border-2 border-background",
                          evento.actual ? "bg-primary" : "bg-muted-foreground/60",
                        )}
                      />
                      <p className="text-sm font-medium text-foreground">
                        {evento.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.tiempo}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="mt-0 shrink-0 border-t bg-muted/30 px-5 py-4">
          <Button variant="outline" className="w-full">
            <Printer data-icon="inline-start" />
            Exportar certificado forense
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
