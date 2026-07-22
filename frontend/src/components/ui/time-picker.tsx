"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  construirHora24,
  formatearHora12,
  parsearHora24,
  type PeriodoHora,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { cn } from "@/lib/utils"

const HORAS = Array.from({ length: 12 }, (_, index) =>
  (index + 1).toString().padStart(2, "0"),
)
const MINUTOS = Array.from({ length: 60 }, (_, index) =>
  index.toString().padStart(2, "0"),
)
const PERIODOS: { valor: PeriodoHora; etiqueta: string }[] = [
  { valor: "a. m.", etiqueta: "AM" },
  { valor: "p. m.", etiqueta: "PM" },
]

interface ColumnaHoraProps {
  label: string
  items: string[]
  value: string
  onSelect: (value: string) => void
}

function ColumnaHora({ label, items, value, onSelect }: ColumnaHoraProps) {
  const selectedRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" })
  }, [value])

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="mb-1 text-center text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <ScrollArea className="h-44 rounded-md border border-border/60 **:data-[slot=scroll-area-scrollbar]:hidden">
        <div className="flex flex-col gap-0.5 px-2 py-1">
          {items.map((item) => {
            const selected = item === value
            return (
              <button
                key={item}
                ref={selected ? selectedRef : undefined}
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm tabular-nums transition-colors",
                  selected
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {item}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

interface SelectorPeriodoProps {
  value: PeriodoHora
  onSelect: (periodo: PeriodoHora) => void
}

function SelectorPeriodo({ value, onSelect }: SelectorPeriodoProps) {
  return (
    <div className="space-y-1">
      <p className="text-center text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        Periodo
      </p>
      <div className="flex gap-1.5">
        {PERIODOS.map(({ valor, etiqueta }) => {
          const selected = valor === value
          return (
            <button
              key={valor}
              type="button"
              onClick={() => onSelect(valor)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 text-foreground hover:bg-muted",
              )}
            >
              {etiqueta}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface TimePickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** Selector de hora con Popover (12 h), valor en formato 24 h "HH:mm". */
export function TimePicker({
  id,
  value = "07:00",
  onChange,
  placeholder = "Seleccionar hora",
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const partes = parsearHora24(value)

  function actualizar(partesParciales: Partial<typeof partes>) {
    const siguiente = { ...partes, ...partesParciales }
    onChange?.(
      construirHora24(siguiente.hora, siguiente.minuto, siguiente.periodo),
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal tabular-nums",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="size-4" />
          {value ? formatearHora12(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex w-44 flex-col gap-2.5">
          <div className="flex gap-2">
            <ColumnaHora
              label="Hora"
              items={HORAS}
              value={partes.hora.toString().padStart(2, "0")}
              onSelect={(item) =>
                actualizar({ hora: Number.parseInt(item, 10) })
              }
            />
            <ColumnaHora
              label="Min"
              items={MINUTOS}
              value={partes.minuto.toString().padStart(2, "0")}
              onSelect={(item) =>
                actualizar({ minuto: Number.parseInt(item, 10) })
              }
            />
          </div>
          <SelectorPeriodo
            value={partes.periodo}
            onSelect={(periodo) => actualizar({ periodo })}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
