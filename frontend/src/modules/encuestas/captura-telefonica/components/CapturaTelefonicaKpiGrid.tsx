import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type KpiVariant = "highlight" | "default" | "warning" | "destructive" | "success"

interface Kpi {
  label: string
  value: string
  sublabel?: string
  variant: KpiVariant
}

export function CapturaTelefonicaKpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className={cn(
            "py-0 shadow-none",
            kpi.variant === "highlight" && "bg-primary border-primary",
            kpi.variant === "warning" && "border-amber-500/40",
            kpi.variant === "destructive" && "border-destructive/40",
            kpi.variant === "success" && "border-emerald-500/30",
          )}
        >
          <CardContent className="px-4 py-3">
            <p
              className={cn(
                "text-xs text-muted-foreground",
                kpi.variant === "highlight" && "text-primary-foreground/80",
              )}
            >
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums text-foreground",
                kpi.variant === "highlight" && "text-primary-foreground",
                kpi.variant === "warning" && "text-amber-600",
                kpi.variant === "destructive" && "text-destructive",
                kpi.variant === "success" && "text-emerald-600",
              )}
            >
              {kpi.value}
              {kpi.sublabel && (
                <span
                  className={cn(
                    "ml-1.5 text-xs font-normal text-muted-foreground",
                    kpi.variant === "highlight" && "text-primary-foreground/80",
                  )}
                >
                  {kpi.sublabel}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
