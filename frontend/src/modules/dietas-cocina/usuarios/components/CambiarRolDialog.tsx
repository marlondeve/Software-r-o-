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
import { ROLES_DIETAS } from "@/lib/configAccesoModulos"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import type { UsuarioModulo } from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"

interface CambiarRolDialogProps {
  usuario: UsuarioModulo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmar: (usuarioId: string, rol: RolDietas) => void
}

export function CambiarRolDialog({
  usuario,
  open,
  onOpenChange,
  onConfirmar,
}: CambiarRolDialogProps) {
  const [rolSeleccionado, setRolSeleccionado] = useState<RolDietas>("Nutricionista")

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
          onValueChange={(value) => setRolSeleccionado(value as RolDietas)}
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES_DIETAS.map((rol) => (
              <SelectItem key={rol} value={rol}>
                {rol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
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
