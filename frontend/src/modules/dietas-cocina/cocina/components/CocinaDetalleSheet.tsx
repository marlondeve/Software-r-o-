import {
  AlertTriangle,
  ClipboardCheck,
  Printer,
  ShieldAlert,
  Truck,
  Utensils,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AlertaCriticaCard } from "@/modules/dietas-cocina/etiquetas/components/AlertaCriticaCard"
import { CocinaSeguimientoTimeline } from "@/modules/dietas-cocina/cocina/components/CocinaSeguimientoTimeline"
import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  claseBadgeEstadoVisibleCocina,
  claseTipoDieta,
  descripcionEstadoLogisticaCocina,
  labelEstadoVisibleCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { etiquetaComidaLabel } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  enPasoEtiquetaSeguimiento,
  puedeContinuarPreparacion,
} from "@/modules/dietas-cocina/cocina/lib/cocinaSeguimiento"
import {
  puedeDespachar,
  puedeEditarChecklist,
  puedeImprimirEtiquetaOrden,
  puedeMarcarLista,
  checklistProgreso,
  motivoNoMarcarLista,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { cn } from "@/lib/utils"

interface CocinaDetalleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orden: OrdenCocina | null
  onMarcarComoLista: (id: string) => void
  onRegistrarDespacho: (id: string) => void
  onContinuarPreparacion: (id: string) => void
  onImprimirEtiqueta: (orden: OrdenCocina) => void
  onChecklistChange: (
    ordenId: string,
    checklistId: string,
    completado: boolean,
  ) => void
  getEtiquetaByOrdenId: (ordenId: string) => EtiquetaEnfermera | undefined
}

export function CocinaDetalleSheet({
  open,
  onOpenChange,
  orden,
  onMarcarComoLista,
  onRegistrarDespacho,
  onContinuarPreparacion,
  onImprimirEtiqueta,
  onChecklistChange,
  getEtiquetaByOrdenId,
}: CocinaDetalleSheetProps) {
  if (!orden) return null

  const etiqueta = getEtiquetaByOrdenId(orden.id)
  const progresoChecklist = checklistProgreso(orden)
  const checklistEditable = puedeEditarChecklist(orden)
  const motivoLista = motivoNoMarcarLista(orden)
  const puedeMarcarListaBtn = puedeMarcarLista(orden)
  const puedeDespacharBtn = puedeDespachar(orden, etiqueta)
  const puedeImprimirBtn = puedeImprimirEtiquetaOrden(orden)

  const puedeContinuar = puedeContinuarPreparacion(orden, etiqueta)
  const mostrarImprimirEtiquetaPrincipal =
    enPasoEtiquetaSeguimiento(orden, etiqueta) && puedeImprimirBtn
  const descripcionLogistica = descripcionEstadoLogisticaCocina(orden, etiqueta)

  const ubicacion = [
    orden.pabellon,
    `Hab ${orden.habitacion}`,
    orden.cama,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[min(100vw,36rem)] data-[side=right]:max-w-36rem"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle>Detalle de bandeja</SheetTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {etiquetaComidaLabel(orden.comida)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "font-medium",
                claseBadgeEstadoVisibleCocina(orden, etiqueta),
              )}
            >
              {labelEstadoVisibleCocina(orden, etiqueta)}
            </Badge>
            {descripcionLogistica && (
              <Badge variant="secondary" className="font-normal">
                {descripcionLogistica}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollAreaFlex>
          <div className="w-full space-y-5 px-5 py-4">
            {orden.aislado && (
              <AlertaCriticaCard
                tipo="aislamiento"
                titulo="Paciente aislado"
                descripcion="Siga estrictamente los protocolos de bioseguridad del pabellón."
              />
            )}
            {orden.alergias.length > 0 && (
              <AlertaCriticaCard
                tipo="alergia"
                titulo="Alergia severa"
                descripcion={orden.alergias.join(", ") + "."}
              />
            )}

            <section className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-semibold text-foreground">{orden.paciente}</p>
              <p className="text-sm text-muted-foreground">{ubicacion}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ID: {orden.pacienteId} · {orden.edad} años
              </p>
            </section>

            <section className="space-y-3">
              <p className="text-sm font-semibold text-primary">
                Información de dieta
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p
                    className={cn(
                      "font-semibold",
                      claseTipoDieta(orden.tipoDieta),
                    )}
                  >
                    {orden.tipoDieta}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consistencia</p>
                  <p className="font-medium">{orden.consistencia}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                <span className="flex items-center gap-1.5 text-xs">
                  <Utensils className="size-3.5" />
                  Porción estándar
                </span>
                {orden.observaciones && (
                  <span className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="size-3.5" />
                    Observaciones
                  </span>
                )}
                {orden.alergias.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <ShieldAlert className="size-3.5" />
                    Alergia
                  </span>
                )}
                {orden.aislado && (
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="size-3.5" />
                    Aislamiento
                  </span>
                )}
              </div>
              {orden.observaciones && (
                <p className="text-sm text-muted-foreground">
                  {orden.observaciones}
                </p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">
                  Checklist operativo
                </p>
                <Badge
                  variant={progresoChecklist.completo ? "default" : "outline"}
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    progresoChecklist.completo
                      ? "bg-primary/10 text-primary"
                      : "text-amber-700 dark:text-amber-300",
                  )}
                >
                  {progresoChecklist.completados}/{progresoChecklist.total}{" "}
                  obligatorios
                </Badge>
              </div>
              {!checklistEditable && (
                <p className="text-xs text-muted-foreground">
                  Checklist cerrado: la bandeja ya avanzó en el flujo de cocina.
                </p>
              )}
              {checklistEditable && !progresoChecklist.completo && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Completa todos los ítems obligatorios para marcar la bandeja
                  como lista.
                </p>
              )}
              <ul className="space-y-2">
                {orden.checklist.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-3 py-2",
                      checklistEditable
                        ? "border-border"
                        : "border-border/60 bg-muted/30",
                    )}
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.completado}
                      disabled={!checklistEditable}
                      onCheckedChange={(checked) =>
                        onChecklistChange(
                          orden.id,
                          item.id,
                          checked === true,
                        )
                      }
                    />
                    <Label
                      htmlFor={item.id}
                      className={cn(
                        "flex-1 text-sm font-normal leading-snug",
                        checklistEditable ? "cursor-pointer" : "cursor-default",
                        item.completado && !checklistEditable && "text-muted-foreground",
                      )}
                    >
                      {item.label}
                      {item.obligatorio && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-destructive">
                          Obligatorio
                        </span>
                      )}
                    </Label>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <p className="text-sm font-semibold text-primary">Seguimiento</p>
              <CocinaSeguimientoTimeline orden={orden} etiqueta={etiqueta} />
            </section>

            <section className="space-y-2">
              <Label className="text-sm font-semibold text-primary">
                Reportar novedad
              </Label>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retraso">Retraso en preparación</SelectItem>
                  <SelectItem value="faltante">Insumo faltante</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </section>
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="shrink-0 flex-col gap-2 border-t px-5 py-4 sm:flex-col">
          <div className="flex w-full flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!puedeMarcarListaBtn}
              title={motivoLista}
              onClick={() => onMarcarComoLista(orden.id)}
            >
              <ClipboardCheck data-icon="inline-start" />
              Marcar como lista
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!puedeImprimirBtn}
              title={
                puedeImprimirBtn
                  ? undefined
                  : "La bandeja debe estar lista para imprimir la etiqueta."
              }
              onClick={() => onImprimirEtiqueta(orden)}
            >
              <Printer data-icon="inline-start" />
              Imprimir etiqueta
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!puedeDespacharBtn}
              onClick={() => onRegistrarDespacho(orden.id)}
            >
              <Truck data-icon="inline-start" />
              Registrar despacho
            </Button>
          </div>
          {puedeContinuar && (
            <Button
              type="button"
              className="w-full"
              onClick={() => onContinuarPreparacion(orden.id)}
            >
              Continuar preparación
            </Button>
          )}
          {mostrarImprimirEtiquetaPrincipal && (
            <Button
              type="button"
              className="w-full"
              onClick={() => onImprimirEtiqueta(orden)}
            >
              <Printer data-icon="inline-start" />
              Imprimir etiqueta
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
