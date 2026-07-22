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
  title: string
  linkLabel?: string
  linkTo?: string
  onLinkClick?: () => void
  children: ReactNode
  className?: string
  headerClassName?: string
  accentTop?: "destructive" | "none"
}

export function DashboardCard({
  title,
  linkLabel,
  linkTo,
  onLinkClick,
  children,
  className,
  headerClassName,
  accentTop = "none",
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "gap-0 py-0 shadow-none",
        accentTop === "destructive" && "border-t-[3px] border-t-destructive",
        className,
      )}
    >
      <CardHeader className={cn("border-b py-3", headerClassName)}>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {linkLabel && (
          <CardAction>
            {linkTo ? (
              <Link
                to={linkTo}
                className="text-xs font-medium text-primary hover:underline"
              >
                {linkLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onLinkClick}
                className="text-xs font-medium text-primary hover:underline"
              >
                {linkLabel}
              </button>
            )}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="py-3">{children}</CardContent>
    </Card>
  )
}
