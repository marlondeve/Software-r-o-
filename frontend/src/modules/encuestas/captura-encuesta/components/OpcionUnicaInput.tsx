import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { OpcionUnica } from "@/modules/encuestas/captura-encuesta/datos/mockCapturaEncuesta"

interface OpcionUnicaInputProps {
  opciones: OpcionUnica[]
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export function OpcionUnicaInput({
  opciones,
  value,
  onChange,
  disabled,
}: OpcionUnicaInputProps) {
  return (
    <RadioGroup
      value={value ?? undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      {opciones.map((opcion) => (
        <label
          key={opcion.id}
          htmlFor={`opcion-${opcion.id}`}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg bg-muted/40 px-4 py-3.5 transition-colors hover:bg-muted/70",
            "has-data-checked:bg-primary/5 has-data-checked:ring-1 has-data-checked:ring-primary/30",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <RadioGroupItem value={opcion.id} id={`opcion-${opcion.id}`} />
          <span className="text-sm text-foreground">{opcion.label}</span>
        </label>
      ))}
    </RadioGroup>
  )
}
