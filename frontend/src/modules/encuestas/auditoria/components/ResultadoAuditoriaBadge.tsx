import { Check, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ResultadoAuditoria } from "@/modules/encuestas/auditoria/datos/mockAuditoriaEncuestas"

export function ResultadoAuditoriaBadge({ resultado }: { resultado: ResultadoAuditoria }) {
  const esExito = resultado === "exito"
  const Icon = esExito ? Check : X

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        esExito
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-destructive/20 bg-destructive/10 text-destructive",
      )}
    >
      <Icon data-icon="inline-start" />
      {esExito ? "Éxito" : "Denegado"}
    </Badge>
  )
}
