import type { ReactNode } from "react"
import { PackageCheck, RotateCcw, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ProgresoEtiquetaStep } from "@/modules/dietas-cocina/etiquetas/components/ProgresoEtiquetaStep"

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

export function AccionesFlujoHub() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
        <Link to="/dietas-cocina/etiquetas/pre-entrega">
          <Truck className="size-5 shrink-0 text-primary" />
          <span className="text-left">
            <span className="block font-medium">Recepción del proveedor</span>
            <span className="text-xs font-normal text-muted-foreground">
              Escanea el QR al recibir la bandeja
            </span>
          </span>
        </Link>
      </Button>
      <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
        <Link to="/dietas-cocina/etiquetas/entrega">
          <PackageCheck className="size-5 shrink-0 text-primary" />
          <span className="text-left">
            <span className="block font-medium">Entrega al paciente</span>
            <span className="text-xs font-normal text-muted-foreground">
              Escanea el QR al entregar la bandeja
            </span>
          </span>
        </Link>
      </Button>
      <Button variant="outline" className="h-auto justify-start gap-3 py-4" asChild>
        <Link to="/dietas-cocina/etiquetas/devolucion">
          <RotateCcw className="size-5 shrink-0 text-destructive" />
          <span className="text-left">
            <span className="block font-medium">Registrar devolución</span>
            <span className="text-xs font-normal text-muted-foreground">
              Devolver bandeja a cocina
            </span>
          </span>
        </Link>
      </Button>
    </div>
  )
}
