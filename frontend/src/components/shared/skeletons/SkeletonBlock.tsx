import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface SkeletonBlockProps {
  children: ReactNode
  className?: string
  "aria-label"?: string
}

export function SkeletonBlock({
  children,
  className,
  "aria-label": ariaLabel = "Cargando contenido",
}: SkeletonBlockProps) {
  return (
    <div
      aria-busy="true"
      aria-label={ariaLabel}
      className={cn("animate-pulse", className)}
    >
      {children}
    </div>
  )
}
