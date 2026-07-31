import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"
import { CAPACIDADES_ETIQUETAS } from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import { Switch } from "@/components/ui/switch"

interface CapacidadesEtiquetasFormProps {
  capacidades: CapacidadEtiquetas[]
  onAlternar: (capacidad: CapacidadEtiquetas, activo: boolean) => void
  disabled?: boolean
  idPrefix?: string
}

const GRUPOS: {
  id: "recepcion" | "bandejas" | "proveedor"
  titulo: string
}[] = [
  { id: "proveedor", titulo: "Proveedor" },
  { id: "recepcion", titulo: "Recepción (enfermería)" },
  { id: "bandejas", titulo: "Bandejas en piso" },
]

export function CapacidadesEtiquetasForm({
  capacidades,
  onAlternar,
  disabled = false,
  idPrefix = "cap-etiquetas",
}: CapacidadesEtiquetasFormProps) {
  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Permisos de bandejas (Etiquetas)
      </p>
      {GRUPOS.map((grupo) => {
        const items = CAPACIDADES_ETIQUETAS.filter((item) => item.grupo === grupo.id)
        if (items.length === 0) return null

        return (
          <div key={grupo.id} className="space-y-1">
            <p className="text-xs font-medium text-foreground">{grupo.titulo}</p>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-2 pl-1"
              >
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`${idPrefix}-${item.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {item.label}
                  </label>
                  {item.descripcion && (
                    <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                  )}
                </div>
                <Switch
                  id={`${idPrefix}-${item.id}`}
                  checked={capacidades.includes(item.id)}
                  disabled={disabled}
                  onCheckedChange={(activo) => onAlternar(item.id, activo === true)}
                  aria-label={item.label}
                />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function alternarCapacidadEtiquetaLista(
  capacidades: CapacidadEtiquetas[],
  capacidad: CapacidadEtiquetas,
  activo: boolean,
): CapacidadEtiquetas[] {
  const set = new Set(capacidades)
  if (activo) set.add(capacidad)
  else set.delete(capacidad)
  return Array.from(set) as CapacidadEtiquetas[]
}
