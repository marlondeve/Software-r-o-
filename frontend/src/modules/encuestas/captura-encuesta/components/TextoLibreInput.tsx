import { Textarea } from "@/components/ui/textarea"

interface TextoLibreInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TextoLibreInput({ value, onChange, disabled }: TextoLibreInputProps) {
  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 500))}
        placeholder="Escriba aquí su comentario (opcional)..."
        disabled={disabled}
        className="min-h-28"
      />
      <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">
        {value.length}/500
      </span>
    </div>
  )
}
