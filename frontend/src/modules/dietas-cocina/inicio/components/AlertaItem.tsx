import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface AlertaItemProps {
  icon: LucideIcon
  title: string
  description: string
  iconClassName?: string
  className?: string
}

export function AlertaItem({
  icon: Icon,
  title,
  description,
  iconClassName,
  className,
}: AlertaItemProps) {
  return (
    <div className={cn("flex gap-3 py-2", className)}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted",
          iconClassName,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

interface AlertaCardProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function AlertaCard({
  title,
  icon: Icon,
  children,
  className,
}: AlertaCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-destructive/5 p-4 ring-1 ring-destructive/10",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-destructive/10">{children}</div>
    </div>
  )
}
