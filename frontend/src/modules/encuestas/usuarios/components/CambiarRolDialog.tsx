import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLES_ENCUESTAS_MODULO, type RolEncuestas } from "@/modules/encuestas/lib/roles"
import type { UsuarioEncuestasModulo } from "@/modules/encuestas/usuarios/datos/mockUsuarios"

interface CambiarRolDialogProps {
  usuario: UsuarioEncuestasModulo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmar: (usuarioId: string, rol: RolEncuestas) => void
}

export function CambiarRolDialog({
  usuario,
  open,
  onOpenChange,
  onConfirmar,
}: CambiarRolDialogProps) {
  const [rolSeleccionado, setRolSeleccionado] = useState<RolEncuestas>("Encuestador")

  useEffect(() => {
    if (usuario) setRolSeleccionado(usuario.rol)
  }, [usuario])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>
            {usuario
              ? `Asigne un nuevo rol a ${usuario.nombre}.`
              : "Seleccione un rol para el usuario."}
          </DialogDescription>
        </DialogHeader>
        <Select
          value={rolSeleccionado}
          onValueChange={(value) => setRolSeleccionado(value as RolEncuestas)}
        >
          <SelectTrigger className="h-11 w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES_ENCUESTAS_MODULO.map((rol) => (
              <SelectItem key={rol} value={rol}>
                {rol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={!usuario}
            onClick={() => {
              if (!usuario) return
              onConfirmar(usuario.id, rolSeleccionado)
              onOpenChange(false)
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
