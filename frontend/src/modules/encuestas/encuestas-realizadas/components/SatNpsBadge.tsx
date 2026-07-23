import { cn } from "@/lib/utils"

function tonoPorValor(valor: number) {
  if (valor <= 5) return "bg-destructive/10 text-destructive"
  if (valor <= 7) return "bg-amber-500/10 text-amber-600"
  return "bg-primary/10 text-primary"
}

export function SatNpsBadge({ valor }: { valor: number | null }) {
  if (valor === null) {
    return <span className="text-sm text-muted-foreground">-</span>
  }

  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        tonoPorValor(valor),
      )}
    >
      {valor}
    </span>
  )
}
