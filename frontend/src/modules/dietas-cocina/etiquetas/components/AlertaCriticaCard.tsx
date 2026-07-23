import { AlertTriangle, ShieldAlert } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

interface AlertaCriticaCardProps {
  titulo: string
  descripcion: string
  tipo: "aislamiento" | "alergia"
}

export function AlertaCriticaCard({
  titulo,
  descripcion,
  tipo,
}: AlertaCriticaCardProps) {
  const Icon = tipo === "alergia" ? ShieldAlert : AlertTriangle

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex gap-3 p-4">
        <Icon className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-destructive">
            {titulo}
          </p>
          <p className="mt-1 text-sm text-destructive/90">{descripcion}</p>
        </div>
      </CardContent>
    </Card>
  )
}
