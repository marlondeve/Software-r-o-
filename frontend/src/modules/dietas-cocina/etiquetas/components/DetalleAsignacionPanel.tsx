import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertaCriticaCard } from "@/modules/dietas-cocina/etiquetas/components/AlertaCriticaCard"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { etiquetaComidaLabel } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"

interface DetalleAsignacionPanelProps {
  etiqueta: EtiquetaEnfermera
  confirmado: boolean
  onConfirmadoChange: (value: boolean) => void
  mostrarVerificacion?: boolean
}

function iniciales(nombre: string): string {
  const partes = nombre.split(/[\s,]+/).filter(Boolean)
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function DetalleAsignacionPanel({
  etiqueta,
  confirmado,
  onConfirmadoChange,
  mostrarVerificacion = true,
}: DetalleAsignacionPanelProps) {
  const ubicacion = [
    `Habitación ${etiqueta.habitacion}`,
    etiqueta.cama,
  ]
    .filter(Boolean)
    .join(" - ")

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      {etiqueta.aislamiento && (
        <AlertaCriticaCard
          tipo="aislamiento"
          titulo="Paciente aislado"
          descripcion="Siga estrictamente los protocolos de bioseguridad del pabellón antes de ingresar. Requiere EPP completo."
        />
      )}
      {etiqueta.alergias && etiqueta.alergias.length > 0 && (
        <AlertaCriticaCard
          tipo="alergia"
          titulo="Alergia severa"
          descripcion={etiqueta.alergias.join(", ") + "."}
        />
      )}

      <Card>
        <CardContent className="flex gap-3 p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {iniciales(etiqueta.paciente)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{etiqueta.paciente}</p>
            <p className="text-sm text-muted-foreground">
              ID Paciente: {etiqueta.pacienteId}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Pabellón</p>
                <p className="font-medium">{etiqueta.pabellonDetalle ?? etiqueta.pabellon}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ubicación</p>
                <p className="font-medium">{ubicacion}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b py-3">
          <p className="text-sm font-semibold text-primary">
            Especificaciones de dieta
          </p>
          <Badge variant="outline" className="bg-lime-500/15 text-lime-700">
            {etiquetaComidaLabel(etiqueta.comida)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="font-medium">{etiqueta.tipoDieta}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Consistencia</p>
            <p className="font-medium">{etiqueta.consistencia}</p>
          </div>
          {etiqueta.observaciones && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Notas de cocina
              </p>
              <p className="mt-1 text-sm">{etiqueta.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {mostrarVerificacion && (
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <Checkbox
            id="verificacion-entrega"
            checked={confirmado}
            onCheckedChange={(v) => onConfirmadoChange(v === true)}
          />
          <Label htmlFor="verificacion-entrega" className="text-sm leading-snug">
            Confirmo haber verificado la identidad del paciente, leído las alertas
            críticas y validado la correspondencia de la bandeja.
          </Label>
        </div>
      )}
    </div>
  )
}
