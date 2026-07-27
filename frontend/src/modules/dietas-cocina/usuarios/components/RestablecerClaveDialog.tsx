import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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

interface RestablecerClaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioModulo | null
  passwordTemporal: string
  mensaje?: string
}

export function RestablecerClaveDialog({
  open,
  onOpenChange,
  usuario,
  passwordTemporal,
  mensaje,
}: RestablecerClaveDialogProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiarClave() {
    try {
      await navigator.clipboard.writeText(passwordTemporal)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseña restablecida</DialogTitle>
          <DialogDescription>
            {usuario
              ? `Nueva contraseña temporal para ${usuario.nombre}. Cópiela y compártala por un canal seguro.`
              : "Nueva contraseña temporal generada."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password-temporal">Contraseña temporal</Label>
            <div className="flex gap-2">
              <Input
                id="password-temporal"
                readOnly
                value={passwordTemporal}
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={() => void copiarClave()}>
                {copiado ? (
                  <Check data-icon="inline-start" className="size-4" />
                ) : (
                  <Copy data-icon="inline-start" className="size-4" />
                )}
                {copiado ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              {mensaje ??
                "El usuario debe iniciar sesión con esta clave y cambiarla en «Cambiar contraseña» del login."}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
