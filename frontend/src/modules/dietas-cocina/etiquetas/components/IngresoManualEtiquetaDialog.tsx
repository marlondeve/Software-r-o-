import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface IngresoManualEtiquetaDialogProps {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  onConfirmar: (codigo: string) => void
}

export function IngresoManualEtiquetaDialog({
  abierto,
  onAbiertoChange,
  onConfirmar,
}: IngresoManualEtiquetaDialogProps) {
  const [codigo, setCodigo] = useState("")

  function enviar() {
    const valor = codigo.trim()
    if (!valor) return
    onConfirmar(valor)
    setCodigo("")
    onAbiertoChange(false)
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ingresar código manualmente</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="codigo-manual">Código de etiqueta</Label>
          <Input
            id="codigo-manual"
            placeholder="Ej. LBL-9021-X"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar()
            }}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onAbiertoChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={enviar} disabled={!codigo.trim()}>
            Buscar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
