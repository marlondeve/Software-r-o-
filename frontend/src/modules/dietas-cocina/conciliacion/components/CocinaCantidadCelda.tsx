import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  claseDiferenciaCantidad,
  filaCocinaEditable,
  textoCantidadCocina,
} from "@/modules/dietas-cocina/conciliacion/lib/conciliacionEstilos"
import { cn } from "@/lib/utils"

interface CocinaCantidadCeldaProps {
  fila: FilaConciliacion
  editable: boolean
  guardando: boolean
  onGuardar: (cantidad: number) => Promise<void>
}

function parseCantidad(raw: string): number | null {
  const txt = raw.trim()
  if (txt === "") return null
  const n = Number.parseInt(txt, 10)
  if (Number.isNaN(n) || n < 0) return null
  return n
}

export function CocinaCantidadCelda({
  fila,
  editable,
  guardando,
  onGuardar,
}: CocinaCantidadCeldaProps) {
  const puedeEditar = editable && filaCocinaEditable(fila)
  const [valor, setValor] = useState(
    fila.cantidadCocina === null ? "" : String(fila.cantidadCocina),
  )

  useEffect(() => {
    setValor(fila.cantidadCocina === null ? "" : String(fila.cantidadCocina))
  }, [fila.cantidadCocina, fila.id])

  if (!puedeEditar) {
    return (
      <span
        className={cn(
          "tabular-nums",
          claseDiferenciaCantidad(fila) || "text-foreground",
        )}
      >
        {textoCantidadCocina(fila)}
      </span>
    )
  }

  async function guardarSiCambio() {
    const cantidad = parseCantidad(valor)
    if (cantidad === null) return
    if (cantidad === fila.cantidadCocina) return
    await onGuardar(cantidad)
  }

  return (
    <div className="relative flex justify-end">
      <Input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        aria-label={`Cantidad cocina ${fila.etiquetaPlanilla}`}
        placeholder="—"
        disabled={guardando}
        className={cn(
          "h-8 w-20 bg-background text-right tabular-nums shadow-none",
          claseDiferenciaCantidad(fila),
        )}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => void guardarSiCambio()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
        }}
      />
      {guardando && (
        <Loader2 className="pointer-events-none absolute top-1/2 -left-5 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
