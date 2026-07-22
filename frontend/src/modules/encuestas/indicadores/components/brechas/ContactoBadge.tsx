import { Ban, PhoneCall, PhoneOff } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ContactoBrecha } from "@/modules/encuestas/indicadores/datos/mockAnalisisBrechas"

const CONFIG: Record<ContactoBrecha, { label: string; className: string; icon: typeof PhoneCall }> = {
  valido: { label: "Válido", className: "text-primary", icon: PhoneCall },
  na: { label: "N/A", className: "text-muted-foreground", icon: Ban },
  invalido: { label: "Inválido", className: "text-destructive", icon: PhoneOff },
}

export function ContactoBadge({ contacto }: { contacto: ContactoBrecha }) {
  const config = CONFIG[contacto]
  const Icon = config.icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", config.className)}>
      <Icon className="size-4" />
      {config.label}
    </span>
  )
}
