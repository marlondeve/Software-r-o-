import type { ReactNode } from "react"
import { Lock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SeccionEncuestaCardProps {
  numero: number
  titulo: string
  pregunta: string
  bloqueada?: boolean
  children: ReactNode
}

export function SeccionEncuestaCard({
  numero,
  titulo,
  pregunta,
  bloqueada,
  children,
}: SeccionEncuestaCardProps) {
  return (
    <Card className="gap-4 py-6 shadow-none">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h2
            className={cn(
              "text-xl font-semibold",
              bloqueada ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {numero}. {titulo}
          </h2>
          {bloqueada && <Lock className="mt-1 size-4 shrink-0 text-muted-foreground" />}
        </div>

        <p className={cn("text-sm", bloqueada ? "text-muted-foreground" : "text-foreground")}>
          {pregunta}
        </p>

        <div className={cn(bloqueada && "pointer-events-none opacity-50")}>{children}</div>
      </CardContent>
    </Card>
  )
}
