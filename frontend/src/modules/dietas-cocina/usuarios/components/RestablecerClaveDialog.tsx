import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"

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

interface RestablecerClaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioModulo | null
  mensaje?: string
}

export function RestablecerClaveDialog({
  open,
  onOpenChange,
  usuario,
  mensaje,
}: RestablecerClaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseña restablecida</DialogTitle>
          <DialogDescription>
            {usuario
              ? `La contraseña de ${usuario.nombre} quedó igual a su nombre de usuario.`
              : "Contraseña restablecida al nombre de usuario."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {usuario && (
            <p className="text-sm text-muted-foreground">
              Usuario de acceso:{" "}
              <span className="font-medium text-foreground">{usuario.usuario}</span>
            </p>
          )}

          <Alert>
            <AlertDescription className="text-sm">
              {mensaje ??
                "Indique al usuario que inicie sesión con su nombre de usuario como contraseña y la cambie en «Cambiar contraseña» del login. No comparta credenciales por canales inseguros."}
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
