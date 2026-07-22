import { Check, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ResultadoAuditoria } from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"
import { resultadoAuditoriaEstilos } from "@/modules/dietas-cocina/auditoria/lib/auditoriaEstilos"
import { cn } from "@/lib/utils"

interface ResultadoAuditoriaBadgeProps {
  resultado: ResultadoAuditoria
  className?: string
}

export function ResultadoAuditoriaBadge({
  resultado,
  className,
}: ResultadoAuditoriaBadgeProps) {
  const config = resultadoAuditoriaEstilos[resultado]
  const Icon = resultado === "exitoso" ? Check : X

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", config.className, className)}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
