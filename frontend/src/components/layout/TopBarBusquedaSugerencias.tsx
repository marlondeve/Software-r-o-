import { Loader2, Search, Tag, User } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SugerenciaBusquedaTopbar } from "@/lib/sugerenciasBusquedaTopbar"

interface TopBarBusquedaSugerenciasProps {
  sugerencias: SugerenciaBusquedaTopbar[]
  cargando: boolean
  indiceActivo: number
  onSeleccionar: (sugerencia: SugerenciaBusquedaTopbar) => void
  termino: string
}

function iconoSugerencia(tipo: SugerenciaBusquedaTopbar["tipo"]) {
  switch (tipo) {
    case "etiqueta":
      return Tag
    case "paciente":
      return User
    default:
      return Search
  }
}

export function TopBarBusquedaSugerencias({
  sugerencias,
  cargando,
  indiceActivo,
  onSeleccionar,
  termino,
}: TopBarBusquedaSugerenciasProps) {
  if (cargando && sugerencias.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        Buscando «{termino.trim()}»…
      </div>
    )
  }

  if (!cargando && sugerencias.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-muted-foreground">
        Sin coincidencias para «{termino.trim()}».
      </div>
    )
  }

  return (
    <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
      {sugerencias.map((sugerencia, index) => {
        const Icono = iconoSugerencia(sugerencia.tipo)
        const activa = index === indiceActivo

        return (
          <li key={sugerencia.id} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={activa}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                activa ? "bg-accent text-accent-foreground" : "hover:bg-muted/70",
                sugerencia.tipo === "accion" && "border-t border-border/60",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSeleccionar(sugerencia)}
            >
              <Icono
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  sugerencia.tipo === "accion"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{sugerencia.titulo}</span>
                {sugerencia.subtitulo && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {sugerencia.subtitulo}
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
