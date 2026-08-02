import { cn } from "@/lib/utils"
import { estadoBadgeTokens } from "@/modules/dietas-cocina/lib/estadosEstilos"
import { useCicloBandejasOpcional } from "@/modules/dietas-cocina/context/cicloBandejasContextStore"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"

interface BadgePendientesSyncProps {
  className?: string
}

export function BadgePendientesSync({ className }: BadgePendientesSyncProps) {
  const apiActiva = usarApiDietasCocina()
  const ciclo = useCicloBandejasOpcional()
  const pendientes = ciclo?.cantidadPendientesSync ?? 0
  const conflictos = ciclo?.cantidadConflictosSync ?? 0

  if (!apiActiva || (pendientes === 0 && conflictos === 0)) return null

  const etiqueta =
    conflictos > 0 && pendientes > 0
      ? `${pendientes} pendiente${pendientes === 1 ? "" : "s"} · ${conflictos} conflicto${conflictos === 1 ? "" : "s"}`
      : conflictos > 0
        ? conflictos === 1
          ? "1 conflicto de sync"
          : `${conflictos} conflictos de sync`
        : pendientes === 1
          ? "1 pendiente de sincronizar"
          : `${pendientes} pendientes de sincronizar`

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        conflictos > 0 ? estadoBadgeTokens.danger : estadoBadgeTokens.warning,
        className,
      )}
    >
      {etiqueta}
    </span>
  )
}
