import { Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useVistaRolAdmin } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import {
  obtenerMatrizPermisosApi,
  useMatrizPermisosVersion,
} from "@/modules/dietas-cocina/lib/permisosMatrizCache"

export function SelectorVistaRolAdmin() {
  const { esAdminReal, rolVistaPreview, vistaPreviewActiva, setRolVistaPreview } =
    useVistaRolAdmin()
  useMatrizPermisosVersion()

  if (!esAdminReal) return null

  const matriz = obtenerMatrizPermisosApi() ?? []
  const rolesPreview = matriz
    .map((entry) => entry.rol?.trim())
    .filter((rol): rol is string => !!rol && rol.toLowerCase() !== "administrador")

  const valorActual = rolVistaPreview ?? "admin"

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Select
        value={valorActual}
        onValueChange={(value) => {
          if (value === "admin") {
            setRolVistaPreview(null)
            return
          }
          setRolVistaPreview(value)
        }}
      >
        <SelectTrigger
          size="sm"
          className="h-8 max-w-[min(100%,14rem)] gap-1.5 border-dashed bg-muted/50 text-xs"
          aria-label="Vista previa por rol"
        >
          <Eye className="size-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Vista por rol" />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="admin">Administrador (acceso completo)</SelectItem>
          {rolesPreview.map((rol) => (
            <SelectItem key={rol} value={rol}>
              {rol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {vistaPreviewActiva && rolVistaPreview && (
        <Badge variant="outline" className="hidden h-6 shrink-0 text-[10px] sm:inline-flex">
          Vista: {rolVistaPreview}
        </Badge>
      )}
    </div>
  )
}

export function BannerVistaRolAdmin() {
  const { vistaPreviewActiva, rolVistaPreview } = useVistaRolAdmin()

  if (!vistaPreviewActiva || !rolVistaPreview) return null

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-center text-xs text-foreground/80">
      Estás visualizando la interfaz como{" "}
      <span className="font-semibold text-primary">{rolVistaPreview}</span>. El
      menú y las pantallas reflejan ese rol.
    </div>
  )
}
