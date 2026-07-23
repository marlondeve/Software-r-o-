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

interface NuevoUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardar: (usuario: Omit<UsuarioModulo, "id">) => void
  usuarioEdit?: UsuarioModulo | null
  onActualizar?: (id: string, usuario: Omit<UsuarioModulo, "id">) => void
}

export function NuevoUsuarioDialog({
  open,
  onOpenChange,
  onGuardar,
  usuarioEdit,
  onActualizar,
}: NuevoUsuarioDialogProps) {
  const [nombre, setNombre] = useState("")
  const [usuario, setUsuario] = useState("")
  const [correo, setCorreo] = useState("")
  const [rol, setRol] = useState<RolDietas>("Enfermera")
  const [servicioArea, setServicioArea] = useState("")

  useEffect(() => {
    if (!open) {
      setNombre("")
      setUsuario("")
      setCorreo("")
      setRol("Enfermera")
      setServicioArea("")
      return
    }
    if (usuarioEdit) {
      setNombre(usuarioEdit.nombre)
      setUsuario(usuarioEdit.usuario)
      setCorreo(usuarioEdit.correo)
      setRol(usuarioEdit.rol)
      setServicioArea(usuarioEdit.servicioArea)
    }
  }, [open, usuarioEdit])

  function guardar() {
    if (!nombre.trim() || !usuario.trim() || !correo.trim()) return

    const payload = {
      nombre: nombre.trim(),
      usuario: usuario.trim(),
      correo: correo.trim(),
      rol,
      servicioArea: servicioArea.trim() || "Sin asignar",
      orgProveedora: rol === "Proveedor" ? "Catering Hospitalario SL" : null,
      estado: usuarioEdit?.estado ?? "activo",
      ultimoAcceso: usuarioEdit?.ultimoAcceso ?? "Recién creado",
      origen: usuarioEdit?.origen ?? "Bital",
    } satisfies Omit<UsuarioModulo, "id">

    if (usuarioEdit && onActualizar) {
      onActualizar(usuarioEdit.id, payload)
    } else {
      onGuardar(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{usuarioEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {usuarioEdit
              ? "Actualice los datos del usuario del módulo Dietas y Cocina."
              : "Registre un usuario para el módulo Dietas y Cocina."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-nombre">Nombre completo</Label>
            <Input
              id="nuevo-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-usuario">Usuario</Label>
            <Input
              id="nuevo-usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-correo">Correo</Label>
            <Input
              id="nuevo-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-rol">Rol</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as RolDietas)}>
              <SelectTrigger id="nuevo-rol" className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_DIETAS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-servicio">Servicio / Área</Label>
            <Input
              id="nuevo-servicio"
              value={servicioArea}
              onChange={(e) => setServicioArea(e.target.value)}
              className="bg-card"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!nombre.trim() || !usuario.trim() || !correo.trim()}
            onClick={guardar}
          >
            {usuarioEdit ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
