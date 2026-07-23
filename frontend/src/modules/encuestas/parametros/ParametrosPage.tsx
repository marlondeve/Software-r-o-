import { useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConflictoLogicoAlert } from "@/modules/encuestas/parametros/components/ConflictoLogicoAlert"
import { ModoPruebaPanel } from "@/modules/encuestas/parametros/components/ModoPruebaPanel"
import { NuevaReglaForm } from "@/modules/encuestas/parametros/components/NuevaReglaForm"
import type { NuevaRegla } from "@/modules/encuestas/parametros/components/NuevaReglaForm"
import { ReglasActivasList } from "@/modules/encuestas/parametros/components/ReglasActivasList"
import { mockParametrosReglas } from "@/modules/encuestas/parametros/datos/mockParametrosReglas"
import type { ReglaActiva } from "@/modules/encuestas/parametros/datos/mockParametrosReglas"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

export function ParametrosPage() {
  const data = mockParametrosReglas
  const [reglasActivas, setReglasActivas] = useState<ReglaActiva[]>(data.reglasActivas)
  const [formKey, setFormKey] = useState(0)

  function guardarRegla(regla: NuevaRegla) {
    const nuevaRegla: ReglaActiva = {
      id: `R${reglasActivas.length + 1}`,
      descripcion: `${regla.accion} "${regla.objetivo}" si ${regla.campoDatos} ${regla.operador.toLowerCase()} ${regla.valor}`,
      estado: "activa",
      modificado: "Justo ahora",
    }
    setReglasActivas((prev) => [nuevaRegla, ...prev])
    setFormKey((key) => key + 1)
  }

  function cancelarRegla() {
    setFormKey((key) => key + 1)
  }

  function editarRegla(regla: ReglaActiva) {
    window.alert(`Editar regla ${regla.id}: ${regla.descripcion}`)
  }

  function eliminarRegla(regla: ReglaActiva) {
    if (window.confirm(`¿Eliminar la regla ${regla.id}?`)) {
      setReglasActivas((prev) => prev.filter((item) => item.id !== regla.id))
    }
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Constructor de Reglas Condicionales"
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => window.alert("Exportando reglas...")}
          >
            <Download data-icon="inline-start" />
            Exportar Reglas
          </Button>
        }
      />

      <ConflictoLogicoAlert
        reglaActual={data.conflicto.reglaActual}
        reglaConflicto={data.conflicto.reglaConflicto}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <NuevaReglaForm
            key={formKey}
            onGuardar={guardarRegla}
            onCancelar={cancelarRegla}
          />

          <ReglasActivasList
            reglas={reglasActivas}
            onEditar={editarRegla}
            onEliminar={eliminarRegla}
          />
        </div>

        <ModoPruebaPanel
          visiblesSiempre={data.visiblesSiempre}
          ocultasSiempre={data.ocultasSiempre}
        />
      </div>
    </div>
  )
}
