import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface InfoChipProps {
  icon?: LucideIcon
  children: React.ReactNode
  variant?: "servicio" | "default"
  className?: string
}

export function InfoChip({
  icon: Icon,
  children,
  variant = "default",
  className,
}: InfoChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
        variant === "servicio"
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border bg-card text-foreground",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  )
}
