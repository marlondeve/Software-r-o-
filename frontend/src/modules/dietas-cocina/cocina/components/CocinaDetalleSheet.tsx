import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import {
  AlertTriangle,
  ShieldAlert,
  Utensils,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { mapChecklistFromApi } from "@/modules/dietas-cocina/api/mappers/ordenCocina.mapper"
import { obtenerDetalleOrdenCocina } from "@/modules/dietas-cocina/api/services/ordenes-cocina-api.service"
import type { OrdenCocinaApiDto } from "@/modules/dietas-cocina/types/api-dtos"

import { Badge } from "@/components/ui/badge"
import { SheetDetailSkeleton } from "@/components/shared/skeletons"
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
import { resolverAccionPrincipalCocina } from "@/modules/dietas-cocina/cocina/lib/cocinaAccionPrincipal"
import {
  claseBadgeEstadoVisibleCocina,
  claseTipoDieta,
  descripcionEstadoLogisticaCocina,
  labelEstadoVisibleCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import { etiquetaComidaLabel } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  puedeEditarChecklist,
  checklistProgreso,
  enRecuperacionChecklistCocina,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { estadoBadgeTokens } from "@/modules/dietas-cocina/lib/estadosEstilos"
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
  onSincronizarChecklist?: (
    ordenId: string,
    checklist: OrdenCocina["checklist"],
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
  onSincronizarChecklist,
  getEtiquetaByOrdenId,
}: CocinaDetalleSheetProps) {
  const apiActiva = usarApiDietasCocina()
  const [detalleApi, setDetalleApi] = useState<OrdenCocinaApiDto | null>(null)
  const [cargandoDetalleApi, setCargandoDetalleApi] = useState(false)
  const ultimoChecklistSync = useRef<string>("")

  useEffect(() => {
    if (!open || !orden?.ordenCocinaApiId || !apiActiva) {
      setDetalleApi(null)
      ultimoChecklistSync.current = ""
      return
    }

    setCargandoDetalleApi(true)
    void obtenerDetalleOrdenCocina(orden.ordenCocinaApiId)
      .then(setDetalleApi)
      .catch(() => setDetalleApi(null))
      .finally(() => setCargandoDetalleApi(false))
  }, [open, orden?.ordenCocinaApiId, apiActiva])

  useEffect(() => {
    if (!orden?.id || !detalleApi?.checklist?.length || !onSincronizarChecklist) return
    const checklist = mapChecklistFromApi(detalleApi.checklist)
    const firma = JSON.stringify(checklist)
    if (firma === ultimoChecklistSync.current) return
    ultimoChecklistSync.current = firma
    onSincronizarChecklist(orden.id, checklist)
  }, [detalleApi, onSincronizarChecklist, orden?.id])

  const ordenActiva = useMemo(() => {
    if (!orden) return null
    if (!detalleApi?.checklist?.length) return orden
    return {
      ...orden,
      checklist: mapChecklistFromApi(detalleApi.checklist),
    }
  }, [orden, detalleApi])

  if (!ordenActiva) return null

  const vista = ordenActiva

  const etiqueta = getEtiquetaByOrdenId(vista.id)
  const progresoChecklist = checklistProgreso(vista)
  const checklistEditable = puedeEditarChecklist(vista)
  const checklistRecuperacion = enRecuperacionChecklistCocina(vista)
  const accionPrincipal = resolverAccionPrincipalCocina(vista, etiqueta)
  const descripcionLogistica = descripcionEstadoLogisticaCocina(vista, etiqueta)

  function ejecutarAccionPrincipal() {
    switch (accionPrincipal.id) {
      case "continuar-preparacion":
        onContinuarPreparacion(vista.id)
        break
      case "marcar-lista":
        onMarcarComoLista(vista.id)
        break
      case "generar-etiqueta":
      case "imprimir-etiqueta":
        onImprimirEtiqueta(vista)
        break
      case "registrar-despacho":
        onRegistrarDespacho(vista.id)
        break
    }
  }

  const IconoAccion = accionPrincipal.icon

  const ubicacion = [
    vista.pabellon,
    `Hab ${vista.habitacion}`,
    vista.cama,
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
              {etiquetaComidaLabel(vista.comida)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "font-medium",
                claseBadgeEstadoVisibleCocina(vista, etiqueta),
              )}
            >
              {labelEstadoVisibleCocina(vista, etiqueta)}
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
            {cargandoDetalleApi && !detalleApi ? (
              <SheetDetailSkeleton />
            ) : (
              <>
            {detalleApi?.observaciones && (
              <section className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                {detalleApi.observaciones}
              </section>
            )}
            {vista.aislado && (
              <AlertaCriticaCard
                tipo="aislamiento"
                titulo="Paciente aislado"
                descripcion="Siga estrictamente los protocolos de bioseguridad del pabellón."
              />
            )}
            {vista.alergias.length > 0 && (
              <AlertaCriticaCard
                tipo="alergia"
                titulo="Alergia severa"
                descripcion={vista.alergias.join(", ") + "."}
              />
            )}

            <section className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-semibold text-foreground">{vista.paciente}</p>
              <p className="text-sm text-muted-foreground">{ubicacion}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ID: {vista.pacienteId} · {vista.edad} años
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
                      claseTipoDieta(vista.tipoDieta),
                    )}
                  >
                    {vista.tipoDieta}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consistencia</p>
                  <p className="font-medium">{vista.consistencia}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                <span className="flex items-center gap-1.5 text-xs">
                  <Utensils className="size-3.5" />
                  Porción estándar
                </span>
                {vista.observaciones && (
                  <span className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="size-3.5" />
                    Observaciones
                  </span>
                )}
                {vista.alergias.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <ShieldAlert className="size-3.5" />
                    Alergia
                  </span>
                )}
                {vista.aislado && (
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="size-3.5" />
                    Aislamiento
                  </span>
                )}
              </div>
              {vista.observaciones && (
                <p className="text-sm text-muted-foreground">
                  {vista.observaciones}
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
                      ? estadoBadgeTokens.success
                      : estadoBadgeTokens.warning,
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
              {checklistRecuperacion && checklistEditable && !progresoChecklist.completo && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  La bandeja quedó como lista sin sincronizar. Completa el
                  checklist obligatorio para poder generar la etiqueta.
                </p>
              )}
              {checklistEditable && !checklistRecuperacion && !progresoChecklist.completo && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Completa todos los ítems obligatorios para marcar la bandeja
                  como lista.
                </p>
              )}
              <ul className="space-y-2">
                {ordenActiva.checklist.map((item) => (
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
                          ordenActiva.id,
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
              <CocinaSeguimientoTimeline orden={vista} etiqueta={etiqueta} />
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
              </>
            )}
          </div>
        </ScrollAreaFlex>

        <SheetFooter className="shrink-0 flex-col gap-2 border-t px-5 py-4 sm:flex-col">
          <Button
            type="button"
            className="w-full"
            disabled={!accionPrincipal.habilitada}
            title={accionPrincipal.motivo}
            onClick={ejecutarAccionPrincipal}
          >
            {IconoAccion && <IconoAccion data-icon="inline-start" />}
            {accionPrincipal.label}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
