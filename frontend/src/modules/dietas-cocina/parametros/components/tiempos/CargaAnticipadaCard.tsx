import { Info } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ModoCargaAnticipada } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { cn } from "@/lib/utils"

interface OpcionCarga {
  id: ModoCargaAnticipada
  titulo: string
  descripcion: string
}

interface CargaAnticipadaCardProps {
  modo: ModoCargaAnticipada
  opciones: OpcionCarga[]
  notaInformativa: string
  onModoChange: (modo: ModoCargaAnticipada) => void
}

export function CargaAnticipadaCard({
  modo,
  opciones,
  notaInformativa,
  onModoChange,
}: CargaAnticipadaCardProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm font-semibold">
          Carga anticipada de tiempos de comida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>{notaInformativa}</p>
        </div>

        <RadioGroup
          value={modo}
          onValueChange={(value) => onModoChange(value as ModoCargaAnticipada)}
          className="gap-3"
        >
          {opciones.map((opcion) => {
            const seleccionada = modo === opcion.id

            return (
              <Label
                key={opcion.id}
                htmlFor={`carga-${opcion.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
                  seleccionada
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <RadioGroupItem
                  id={`carga-${opcion.id}`}
                  value={opcion.id}
                  className="mt-0.5"
                />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {opcion.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {opcion.descripcion}
                  </p>
                </div>
              </Label>
            )
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
