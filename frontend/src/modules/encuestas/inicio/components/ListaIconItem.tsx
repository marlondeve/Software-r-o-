import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

interface ListaIconItemProps {
  icon: LucideIcon
  title: string
  description: string
  to?: string
  tone?: "default" | "alerta"
  className?: string
}

export function ListaIconItem({
  icon: Icon,
  title,
  description,
  to,
  tone = "default",
  className,
}: ListaIconItemProps) {
  const contenido = (
    <>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          tone === "alerta"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          "flex gap-3 rounded-lg py-2 transition-colors hover:bg-muted/60",
          className,
        )}
      >
        {contenido}
      </Link>
    )
  }

  return <div className={cn("flex gap-3 py-2", className)}>{contenido}</div>
}
