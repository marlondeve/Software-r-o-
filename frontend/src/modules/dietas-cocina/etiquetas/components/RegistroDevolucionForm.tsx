import type { MotivoDevolucionFlujo } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { Camera, ImagePlus } from "lucide-react"
import { useState } from "react"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BandejaResumenCard } from "@/modules/dietas-cocina/etiquetas/components/BandejaResumenCard"
import { claseChipMotivoDevolucion } from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import { cn } from "@/lib/utils"

interface RegistroDevolucionFormProps {
  etiqueta: EtiquetaEnfermera
  motivo: MotivoDevolucionFlujo | null
  motivos: readonly string[]
  descripcion?: string
  etiquetaMotivo?: string
  observaciones: string
  onMotivoChange: (motivo: MotivoDevolucionFlujo) => void
  onObservacionesChange: (value: string) => void
  onFotoChange?: (archivo: File | null) => void
}

export function RegistroDevolucionForm({
  etiqueta,
  motivo,
  motivos,
  descripcion,
  etiquetaMotivo = "Motivo principal",
  observaciones,
  onMotivoChange,
  onObservacionesChange,
  onFotoChange,
}: RegistroDevolucionFormProps) {
  const [fotoNombre, setFotoNombre] = useState<string | null>(null)

  function actualizarFoto(archivo: File | null) {
    setFotoNombre(archivo?.name ?? null)
    onFotoChange?.(archivo)
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <BandejaResumenCard etiqueta={etiqueta} />

      {descripcion && (
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      )}

      <div className="space-y-2">
        <Label>
          {etiquetaMotivo} <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {motivos.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onMotivoChange(item as MotivoDevolucionFlujo)
              }}
              className={cn(
                "rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors",
                claseChipMotivoDevolucion(motivo === item),
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Evidencia fotográfica (opcional)</Label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          {fotoNombre ? (
            <>
              <ImagePlus className="size-8 text-primary" />
              <span className="text-sm font-medium">{fotoNombre}</span>
            </>
          ) : (
            <>
              <Camera className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium">Capturar o subir foto</span>
              <span className="text-xs text-muted-foreground">
                Soporta JPG, PNG (máx. 5 MB)
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              actualizarFoto(file)
            }}
          />
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="obs-devolucion">Observaciones adicionales</Label>
        <Textarea
          id="obs-devolucion"
          rows={4}
          placeholder="Detalles específicos sobre el estado de la bandeja o comentarios del paciente…"
          value={observaciones}
          onChange={(e) => onObservacionesChange(e.target.value)}
        />
      </div>
    </div>
  )
}
