import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

interface VistaPreviaEnfermeriaProps {
  pabellon: string
  comidaCerrada: string
  proximaComida: string
  proximaHora: string
  botonSolicitar: string
  botonDeshabilitado?: boolean
}

export function VistaPreviaEnfermeria({
  pabellon,
  comidaCerrada,
  proximaComida,
  proximaHora,
  botonSolicitar,
  botonDeshabilitado,
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

        <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Solicitud cerrada para {comidaCerrada}. Próxima ventana: {proximaComida}{" "}
            ({formatearHora12(proximaHora)})
          </p>
        </div>

        <Button className="w-full" disabled={botonDeshabilitado}>
          {botonSolicitar}
        </Button>
      </CardContent>
    </Card>
  )
}
