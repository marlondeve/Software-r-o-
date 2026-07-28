import {
  APP_DEVELOPER,
  APP_NAME,
  APP_VERSION,
  obtenerTextoCopyright,
  obtenerTextoCopyrightCorto,
} from "@/lib/appInfo"
import { cn } from "@/lib/utils"

interface AppLegalFooterProps {
  variant?: "default" | "compact"
  className?: string
}

export function AppLegalFooter({
  variant = "default",
  className,
}: AppLegalFooterProps) {
  if (variant === "compact") {
    return (
      <footer
        className={cn(
          "px-2.5 py-1 text-[10px] leading-snug text-center text-muted-foreground",
          className,
        )}
        aria-label="Información legal del software"
        title={`${obtenerTextoCopyright()} Desarrollado por ${APP_DEVELOPER}`}
      >
        <p className="text-wrap wrap-break-words">
          {obtenerTextoCopyrightCorto()}
        </p>
        <p className="text-wrap wrap-break-words">
          Versión {APP_VERSION}
        </p>
      </footer>
    )
  }

  return (
    <footer
      className={cn("space-y-1 text-center text-xs text-muted-foreground", className)}
      aria-label="Información legal del software"
    >
      <p className="font-medium text-foreground/80">{APP_NAME}</p>
      <p>{obtenerTextoCopyright()}</p>
      <p>Desarrollado por {APP_DEVELOPER}</p>
      <p className="text-[11px]">Versión {APP_VERSION}</p>
    </footer>
  )
}
