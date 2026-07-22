import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  color?: "primary" | "secondary" | "muted"
  className?: string
  showLabel?: boolean
  label?: string
}

const COLOR_MAP = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  muted: "bg-muted-foreground/30",
} as const

export function ProgressBar({
  value,
  color = "primary",
  className,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums text-foreground">
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", COLOR_MAP[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

interface ProgressStatProps {
  label: string
  current: number
  total: number
  className?: string
}

export function ProgressStat({
  label,
  current,
  total,
  className,
}: ProgressStatProps) {
  const pct = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">
          {current} / {total}
        </span>
      </div>
      <ProgressBar value={pct} />
    </div>
  )
}
