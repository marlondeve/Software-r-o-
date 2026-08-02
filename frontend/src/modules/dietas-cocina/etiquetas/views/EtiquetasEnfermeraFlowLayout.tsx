import type { ReactNode } from "react"
import { ArrowLeft, PackageCheck, RotateCcw, Truck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { ProgresoEtiquetaStep } from "@/modules/dietas-cocina/etiquetas/components/ProgresoEtiquetaStep"
import { BannerConectividadBandejas } from "@/modules/dietas-cocina/etiquetas/components/BannerConectividadBandejas"
import {
  ETIQUETAS_PASOS_FLUJO,
  ETIQUETAS_TOTAL_PASOS_FLUJO,
} from "@/modules/dietas-cocina/etiquetas/lib/flujosEtiquetaSteps"
import { puedeCapacidadEtiquetas } from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"
import { RUTAS_LOGISTICA, rutaLogisticaDevolucion } from "@/modules/dietas-cocina/lib/rutasLogistica"

interface EtiquetasEnfermeraFlowLayoutProps {
  titulo: string
  paso: number
  totalPasos?: number
  pasos?: readonly string[]
  /** Ruta al pulsar «Volver» (prioridad sobre onVolver). */
  rutaVolver?: string
  /** Etiqueta del botón volver. */
  etiquetaVolver?: string
  onVolver?: () => void
  ocultarVolver?: boolean
  children: ReactNode
  footer?: ReactNode
}

export function EtiquetasEnfermeraFlowLayout({
  titulo,
  paso,
  totalPasos = ETIQUETAS_TOTAL_PASOS_FLUJO,
  pasos = ETIQUETAS_PASOS_FLUJO,
  rutaVolver,
  etiquetaVolver = "Volver",
  onVolver,
  ocultarVolver = false,
  children,
  footer,
}: EtiquetasEnfermeraFlowLayoutProps) {
  const navigate = useNavigate()

  function manejarVolver() {
    if (onVolver) {
      onVolver()
      return
    }
    if (rutaVolver) {
      navigate(rutaVolver)
    }
  }

  const mostrarVolver = !ocultarVolver && (Boolean(rutaVolver) || Boolean(onVolver))

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-lg flex-col pb-8">
      <header className="space-y-4">
        <BannerConectividadBandejas />
        <div className="flex items-center gap-2">
          {mostrarVolver ? (
            rutaVolver && !onVolver ? (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 shrink-0 gap-1.5 text-muted-foreground"
                asChild
              >
                <Link to={rutaVolver}>
                  <ArrowLeft className="size-4" />
                  {etiquetaVolver}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 shrink-0 gap-1.5 text-muted-foreground"
                onClick={manejarVolver}
              >
                <ArrowLeft className="size-4" />
                {etiquetaVolver}
              </Button>
            )
          ) : (
            <span className="size-9 shrink-0" aria-hidden />
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{titulo}</h1>
        </div>
        <ProgresoEtiquetaStep paso={paso} total={totalPasos} pasos={pasos} />
      </header>

      <div className="mt-5 flex-1">{children}</div>

      {footer && (
        <div className="sticky bottom-0 -mx-1 mt-4 border-t bg-background/95 px-1 pt-4 backdrop-blur supports-backdrop-filter:bg-background/80">
          {footer}
        </div>
      )}
    </div>
  )
}

const ACCIONES_FLUJO: {
  capacidad: CapacidadEtiquetas
  to: string
  icon: typeof Truck
  titulo: string
  descripcion: string
  iconClassName?: string
}[] = [
  {
    capacidad: "recepcion_proveedor",
    to: RUTAS_LOGISTICA.recepcionEscaneo,
    icon: Truck,
    titulo: "Recepción del proveedor",
    descripcion: "Escanea el QR al recibir la bandeja",
  },
  {
    capacidad: "entrega_paciente",
    to: RUTAS_LOGISTICA.pisoEntrega,
    icon: PackageCheck,
    titulo: "Entrega al paciente",
    descripcion: "Escanea el QR al entregar la bandeja",
  },
  {
    capacidad: "rechazo_antes_entrega",
    to: rutaLogisticaDevolucion("antes-entrega"),
    icon: RotateCcw,
    titulo: "Rechazo antes de entrega",
    descripcion: "No entregarás la bandeja al paciente",
    iconClassName: "text-amber-600",
  },
  {
    capacidad: "recogida_bandeja",
    to: rutaLogisticaDevolucion("paciente"),
    icon: RotateCcw,
    titulo: "Recogida de bandeja",
    descripcion: "Registra el consumo al recoger la bandeja",
    iconClassName: "text-destructive",
  },
]

export function AccionesFlujoHub({
  capacidades,
  className,
}: {
  /** Si se omite, muestra todas las acciones permitidas al rol. */
  capacidades?: CapacidadEtiquetas[]
  className?: string
}) {
  const rol = useRolVistaEfectivo()
  const permitidas = capacidades ?? ACCIONES_FLUJO.map((accion) => accion.capacidad)
  const acciones = ACCIONES_FLUJO.filter(
    (accion) =>
      permitidas.includes(accion.capacidad) &&
      puedeCapacidadEtiquetas(rol, accion.capacidad),
  )

  if (acciones.length === 0) return null

  const columnas =
    acciones.length === 1
      ? "grid-cols-1"
      : acciones.length === 2
        ? "sm:grid-cols-2"
        : acciones.length === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-4"

  return (
    <div className={cn("grid gap-3", columnas, className)}>
      {acciones.map((accion) => {
        const Icono = accion.icon
        return (
          <Button
            key={accion.capacidad}
            variant="outline"
            className="h-auto justify-start gap-3 py-4"
            asChild
          >
            <Link to={accion.to}>
              <Icono
                className={cn(
                  "size-5 shrink-0",
                  accion.iconClassName ?? "text-primary",
                )}
              />
              <span className="text-left">
                <span className="block font-medium">{accion.titulo}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {accion.descripcion}
                </span>
              </span>
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
