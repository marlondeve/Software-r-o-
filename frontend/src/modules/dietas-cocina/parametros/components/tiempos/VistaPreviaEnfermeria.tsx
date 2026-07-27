import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { cn } from "@/lib/utils"

interface VistaPreviaEnfermeriaProps {
  pabellon: string
  comidaCerrada: string
  proximaComida: string
  proximaHora: string
  botonSolicitar: string
  botonDeshabilitado?: boolean
  ventanaAbierta?: boolean
  mensajeVentanaAbierta?: string
}

export function VistaPreviaEnfermeria({
  pabellon,
  comidaCerrada,
  proximaComida,
  proximaHora,
  botonSolicitar,
  botonDeshabilitado,
  ventanaAbierta,
  mensajeVentanaAbierta,
}: VistaPreviaEnfermeriaProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm font-semibold">
          Vista previa para enfermería
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Pabellón</p>
          <p className="text-sm font-semibold text-foreground">{pabellon}</p>
        </div>

        {ventanaAbierta ? (
          <div className="flex gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>
              {mensajeVentanaAbierta ??
                `Ventana abierta para ${comidaCerrada.toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Solicitud cerrada para {comidaCerrada}. Próxima ventana: {proximaComida}{" "}
              ({formatearHora12(proximaHora)})
            </p>
          </div>
        )}

        <Button
          className={cn("w-full", ventanaAbierta && "bg-primary hover:bg-primary/90")}
          disabled={botonDeshabilitado}
        >
          {botonSolicitar}
        </Button>
      </CardContent>
    </Card>
  )
}
