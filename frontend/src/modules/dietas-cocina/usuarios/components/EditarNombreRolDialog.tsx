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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { editarRol } from "@/modules/dietas-cocina/api/services/usuarios.service"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"

interface EditarNombreRolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rolId: string
  nombreActual: string
  nombresExistentes: string[]
  apiActiva: boolean
  onRolRenombrado: () => void
}

export function EditarNombreRolDialog({
  open,
  onOpenChange,
  rolId,
  nombreActual,
  nombresExistentes,
  apiActiva,
  onRolRenombrado,
}: EditarNombreRolDialogProps) {
  const [nombre, setNombre] = useState(nombreActual)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (open) setNombre(nombreActual)
  }, [open, nombreActual])

  const nombreNormalizado = nombre.trim()
  const sinCambios =
    nombreNormalizado.toLowerCase() === nombreActual.trim().toLowerCase()
  const nombreDuplicado = nombresExistentes.some(
    (item) =>
      item.toLowerCase() === nombreNormalizado.toLowerCase() &&
      item.toLowerCase() !== nombreActual.trim().toLowerCase(),
  )

  async function guardar() {
    if (nombreNormalizado.length < 3) {
      demoToast("El nombre del rol debe tener al menos 3 caracteres.", "error")
      return
    }
    if (nombreDuplicado) {
      demoToast("Ya existe un rol con ese nombre.", "error")
      return
    }
    if (sinCambios) {
      onOpenChange(false)
      return
    }
    if (!apiActiva) {
      demoToast("Renombrar roles requiere conexión con el API.", "error")
      return
    }

    setGuardando(true)
    try {
      await editarRol(rolId, nombreNormalizado)
      demoToast(`Rol renombrado a "${nombreNormalizado}".`, "success")
      onRolRenombrado()
      onOpenChange(false)
    } catch (error) {
      demoToast(
        error instanceof Error ? error.message : "No se pudo renombrar el rol.",
        "error",
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renombrar rol</DialogTitle>
          <DialogDescription>
            Cambie el nombre del rol <strong>{nombreActual}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="editar-rol-nombre">Nuevo nombre</Label>
          <Input
            id="editar-rol-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Supervisor de cocina"
            className="bg-card"
          />
          {nombreDuplicado && (
            <p className="text-sm text-destructive">
              Ya existe un rol con ese nombre.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              guardando ||
              nombreNormalizado.length < 3 ||
              nombreDuplicado ||
              sinCambios
            }
            onClick={() => void guardar()}
          >
            {guardando ? "Guardando…" : "Guardar nombre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
