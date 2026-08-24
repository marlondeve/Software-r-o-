import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { TopBarBusquedaSugerencias } from "@/components/layout/TopBarBusquedaSugerencias"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { useSugerenciasBusquedaTopbar } from "@/hooks/useSugerenciasBusquedaTopbar"
import {
  clasificarBusquedaTopbar,
  mensajeSinDestinoBusqueda,
  normalizarTerminoBusqueda,
  resolverDestinoBusqueda,
} from "@/lib/busquedaTopbar"
import type { SugerenciaBusquedaTopbar } from "@/lib/sugerenciasBusquedaTopbar"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import type { ModuloId } from "@/types/module"

interface TopBarBusquedaProps {
  modulo: ModuloId | null
  rol: string | null
  placeholder: string
  className?: string
}

export function TopBarBusqueda({
  modulo,
  rol,
  placeholder,
  className,
}: TopBarBusquedaProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [termino, setTermino] = useState("")
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [indiceActivo, setIndiceActivo] = useState(-1)

  const { sugerencias, cargando, panelVisible, haySugerencias } =
    useSugerenciasBusquedaTopbar({
      modulo,
      rol,
      termino,
      habilitado: panelAbierto,
    })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get("q")?.trim() ?? ""
    if (q) {
      setTermino(q)
      return
    }
    if (!location.pathname.includes("/consulta/")) {
      setTermino("")
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    setIndiceActivo(sugerencias.length > 0 ? 0 : -1)
  }, [sugerencias])

  function cerrarPanel() {
    setPanelAbierto(false)
    setIndiceActivo(-1)
  }

  function navegarADestino(destino: string, mensaje?: string) {
    if (mensaje) demoToast(mensaje, "info")
    cerrarPanel()
    navigate(destino)
  }

  function seleccionarSugerencia(sugerencia: SugerenciaBusquedaTopbar) {
    navegarADestino(sugerencia.destino)
  }

  function ejecutarBusqueda(event?: FormEvent) {
    event?.preventDefault()
    const q = normalizarTerminoBusqueda(termino)
    if (!q) return

    if (
      panelAbierto &&
      indiceActivo >= 0 &&
      indiceActivo < sugerencias.length
    ) {
      seleccionarSugerencia(sugerencias[indiceActivo])
      return
    }

    const destino = resolverDestinoBusqueda(modulo, q, rol)
    if (!destino) {
      demoToast(mensajeSinDestinoBusqueda(modulo, q), "warning")
      return
    }

    const mensaje =
      clasificarBusquedaTopbar(q) === "etiqueta"
        ? `Consultando etiqueta ${q}`
        : undefined
    navegarADestino(destino, mensaje)
  }

  function manejarTeclado(event: KeyboardEvent<HTMLInputElement>) {
    if (!panelAbierto || sugerencias.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setIndiceActivo((prev) =>
        prev < sugerencias.length - 1 ? prev + 1 : 0,
      )
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setIndiceActivo((prev) =>
        prev > 0 ? prev - 1 : sugerencias.length - 1,
      )
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      cerrarPanel()
    }
  }

  const mostrarPanel =
    panelAbierto && panelVisible && (cargando || haySugerencias || termino.trim().length >= 2)

  return (
    <Popover
      open={mostrarPanel}
      onOpenChange={(abierto) => {
        if (!abierto) cerrarPanel()
      }}
    >
      <PopoverAnchor asChild>
        <form
          className={className}
          role="search"
          onSubmit={ejecutarBusqueda}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            value={termino}
            onChange={(event) => {
              setTermino(event.target.value)
              setPanelAbierto(true)
            }}
            onFocus={() => setPanelAbierto(true)}
            onBlur={() => {
              window.setTimeout(() => cerrarPanel(), 150)
            }}
            onKeyDown={manejarTeclado}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-expanded={mostrarPanel}
            aria-controls="topbar-busqueda-sugerencias"
            aria-autocomplete="list"
            enterKeyHint="search"
            autoComplete="off"
            className="h-8 w-full rounded-full border-0 bg-muted py-0 pl-9 text-sm shadow-none focus-visible:ring-1"
          />
        </form>
      </PopoverAnchor>

      <PopoverContent
        id="topbar-busqueda-sugerencias"
        align="start"
        sideOffset={6}
        className="w-(--radix-popover-trigger-width) p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (inputRef.current?.contains(event.target as Node)) {
            event.preventDefault()
          }
        }}
      >
        <TopBarBusquedaSugerencias
          sugerencias={sugerencias}
          cargando={cargando}
          indiceActivo={indiceActivo}
          onSeleccionar={seleccionarSugerencia}
          termino={termino}
        />
      </PopoverContent>
    </Popover>
  )
}
