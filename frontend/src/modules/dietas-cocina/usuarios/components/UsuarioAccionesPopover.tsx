import { useState } from "react"
import {
  KeyRound,
  MoreHorizontal,
  PencilLine,
  Shield,
  Trash2,
  UserX,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { UsuarioModulo } from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"
import { cn } from "@/lib/utils"

interface UsuarioAccionesPopoverProps {
  usuario: UsuarioModulo
  puedeGestionar: boolean
  onEditar: (usuario: UsuarioModulo) => void
  onCambiarRol: (usuario: UsuarioModulo) => void
  onToggleEstado: (usuario: UsuarioModulo) => void
  onRestablecerClave: (usuario: UsuarioModulo) => void
  onEliminar: (usuario: UsuarioModulo) => void
}

const opcionClassName =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"

export function UsuarioAccionesPopover({
  usuario,
  puedeGestionar,
  onEditar,
  onCambiarRol,
  onToggleEstado,
  onRestablecerClave,
  onEliminar,
}: UsuarioAccionesPopoverProps) {
  const [open, setOpen] = useState(false)

  function ejecutar(accion: () => void) {
    accion()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones para {usuario.nombre}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onEditar(usuario))}
        >
          <PencilLine className="size-4 text-muted-foreground" />
          Editar usuario
        </button>
        <button
          type="button"
          className={opcionClassName}
          disabled={!puedeGestionar}
          onClick={() => ejecutar(() => onCambiarRol(usuario))}
        >
          <Shield className="size-4 text-muted-foreground" />
          Cambiar rol
        </button>
        <button
          type="button"
          className={opcionClassName}
          disabled={!puedeGestionar}
          onClick={() => ejecutar(() => onToggleEstado(usuario))}
        >
          <UserX className="size-4 text-muted-foreground" />
          {usuario.estado === "activo" ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onRestablecerClave(usuario))}
        >
          <KeyRound className="size-4 text-muted-foreground" />
          Restablecer clave
        </button>
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          className={cn(
            opcionClassName,
            "text-destructive hover:bg-destructive/10",
          )}
          disabled={!puedeGestionar}
          onClick={() => ejecutar(() => onEliminar(usuario))}
        >
          <Trash2 className="size-4" />
          Eliminar
        </button>
      </PopoverContent>
    </Popover>
  )
}
