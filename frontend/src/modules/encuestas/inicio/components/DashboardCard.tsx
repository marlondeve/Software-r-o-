import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: ReactNode
  icon?: ReactNode
  linkLabel?: string
  linkTo?: string
  children: ReactNode
  className?: string
  headerClassName?: string
  tone?: "default" | "alerta"
}

export function DashboardCard({
  title,
  icon,
  linkLabel,
  linkTo,
  children,
  className,
  headerClassName,
  tone = "default",
}: DashboardCardProps) {
  return (
    <Card className={cn("gap-0 py-0 shadow-none", className)}>
      <CardHeader className={cn("border-b py-3", headerClassName)}>
        <CardTitle
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            tone === "alerta" && "text-destructive",
          )}
        >
          {icon}
          {title}
        </CardTitle>
        {linkLabel && linkTo && (
          <CardAction>
            <Link
              to={linkTo}
              className="text-xs font-medium text-primary hover:underline"
            >
              {linkLabel}
            </Link>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="py-3">{children}</CardContent>
    </Card>
  )
}
