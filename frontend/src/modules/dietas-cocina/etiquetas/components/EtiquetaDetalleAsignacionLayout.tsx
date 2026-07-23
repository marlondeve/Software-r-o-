import type { ReactNode } from "react"
import { ArrowLeft, QrCode } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

interface EtiquetaDetalleAsignacionLayoutProps {
  children: ReactNode
  footer?: ReactNode
}

export function EtiquetaDetalleAsignacionLayout({
  children,
  footer,
}: EtiquetaDetalleAsignacionLayoutProps) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="flex items-center justify-between border-b px-2 py-3 sm:px-4">
        <Button variant="ghost" size="icon" asChild aria-label="Volver">
          <Link to="/dietas-cocina/etiquetas">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-base font-semibold text-foreground">
          Detalle de Asignación
        </h1>
        <Button variant="ghost" size="icon" asChild aria-label="Escanear otra etiqueta">
          <Link to="/dietas-cocina/etiquetas/entrega">
            <QrCode className="size-5" />
          </Link>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">{children}</main>

      {footer && (
        <footer className="sticky bottom-0 border-t bg-background p-4">{footer}</footer>
      )}
    </div>
  )
}
