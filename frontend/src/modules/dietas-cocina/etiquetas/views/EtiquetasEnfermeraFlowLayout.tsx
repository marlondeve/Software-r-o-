import type { ReactNode } from "react"
import { PackageCheck, RotateCcw, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { ProgresoEtiquetaStep } from "@/modules/dietas-cocina/etiquetas/components/ProgresoEtiquetaStep"
import {
  puedeCapacidadEtiquetas,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"

interface EtiquetasEnfermeraFlowLayoutProps {
  titulo: string
  paso: number
  totalPasos: number
  children: ReactNode
  footer?: ReactNode
}

export function EtiquetasEnfermeraFlowLayout({
  titulo,
  paso,
  totalPasos,
  children,
  footer,
}: EtiquetasEnfermeraFlowLayoutProps) {
  return (
    <div className="space-y-5 pb-8">
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-lg font-semibold">{titulo}</h1>
        <ProgresoEtiquetaStep paso={paso} total={totalPasos} />
      </div>
      {children}
      {footer && <div className="sticky bottom-0 border-t bg-background pt-4">{footer}</div>}
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
    to: "/dietas-cocina/etiquetas/pre-entrega",
    icon: Truck,
    titulo: "Recepción del proveedor",
    descripcion: "Escanea el QR al recibir la bandeja",
  },
  {
    capacidad: "entrega_paciente",
    to: "/dietas-cocina/etiquetas/entrega",
    icon: PackageCheck,
    titulo: "Entrega al paciente",
    descripcion: "Escanea el QR al entregar la bandeja",
  },
  {
    capacidad: "rechazo_antes_entrega",
    to: "/dietas-cocina/etiquetas/devolucion/antes-entrega",
    icon: RotateCcw,
    titulo: "Rechazo antes de entrega",
    descripcion: "No entregarás la bandeja al paciente",
    iconClassName: "text-amber-600",
  },
  {
    capacidad: "recogida_bandeja",
    to: "/dietas-cocina/etiquetas/devolucion/paciente",
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
