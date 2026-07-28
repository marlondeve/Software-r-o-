import { cn } from "@/lib/utils"
import { APP_NAME_ACCENT, APP_NAME_STEM } from "@/lib/appInfo"

type AppBrandNameProps = {
  className?: string
  accentClassName?: string
  as?: "span" | "h1" | "p"
}

export function AppBrandName({
  className,
  accentClassName,
  as: Tag = "span",
}: AppBrandNameProps) {
  return (
    <Tag className={className}>
      {APP_NAME_STEM}
      <span className={cn("text-primary", accentClassName)}>{APP_NAME_ACCENT}</span>
    </Tag>
  )
}
