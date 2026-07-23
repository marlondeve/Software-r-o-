import { useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { CrearDietaSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/CrearDietaSheet"
import { DesactivarDietaDialog } from "@/modules/dietas-cocina/dietas-tarifas/components/DesactivarDietaDialog"
import { DietasTarifasTabla } from "@/modules/dietas-cocina/dietas-tarifas/components/DietasTarifasTabla"
import { EditarDietaSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/EditarDietaSheet"
import { HistoricoTarifasSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/HistoricoTarifasSheet"
import { NuevaTarifaSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/NuevaTarifaSheet"
import {
  crearDietasCatalogoIniciales,
  TAMANO_PAGINA_CATALOGO,
  type DietaCatalogo,
} from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"

export function DietasTarifasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [dietas, setDietas] = useState<DietaCatalogo[]>(crearDietasCatalogoIniciales)
  const [paginaActual, setPaginaActual] = useState(1)

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editarDieta, setEditarDieta] = useState<DietaCatalogo | null>(null)
  const [historicoDieta, setHistoricoDieta] = useState<DietaCatalogo | null>(null)
  const [tarifaDieta, setTarifaDieta] = useState<DietaCatalogo | null>(null)
  const [desactivarDieta, setDesactivarDieta] = useState<DietaCatalogo | null>(null)

  useEffect(() => {
    if (searchParams.get("crear") === "1") {
      setCrearAbierto(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const totalRegistros = dietas.length
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / TAMANO_PAGINA_CATALOGO))

  const dietasPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * TAMANO_PAGINA_CATALOGO
    return dietas.slice(inicio, inicio + TAMANO_PAGINA_CATALOGO)
  }, [dietas, paginaActual])

  const siguienteCodigo = useMemo(() => {
    const nums = dietas
      .map((d) => Number.parseInt(d.codigo.replace(/\D/g, ""), 10))
      .filter((n) => !Number.isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    return `D-${String(max + 1).padStart(3, "0")}`
  }, [dietas])

  function actualizarDieta(actualizada: DietaCatalogo) {
    setDietas((prev) =>
      prev.map((d) => (d.id === actualizada.id ? actualizada : d)),
    )
  }

  function abrirNuevaTarifa(dieta: DietaCatalogo) {
    setHistoricoDieta(null)
    setTarifaDieta(dieta)
  }

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Dietas y tarifas"
        subtitle="Gestión general de catálogos y parámetros tarifarios."
        actions={
          <Button type="button" size="sm" onClick={() => setCrearAbierto(true)}>
            <Plus data-icon="inline-start" />
            Crear dieta
          </Button>
        }
      />

      <DietasTarifasTabla
        dietas={dietasPagina}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        tamanoPagina={TAMANO_PAGINA_CATALOGO}
        onCambiarPagina={setPaginaActual}
        onEditar={setEditarDieta}
        onHistorico={setHistoricoDieta}
        onNuevaTarifa={setTarifaDieta}
        onDesactivar={setDesactivarDieta}
      />

      <CrearDietaSheet
        open={crearAbierto}
        onOpenChange={setCrearAbierto}
        siguienteCodigo={siguienteCodigo}
        onGuardar={(dieta) => {
          setDietas((prev) => [dieta, ...prev])
          setPaginaActual(1)
        }}
      />

      <EditarDietaSheet
        open={editarDieta !== null}
        onOpenChange={(open) => !open && setEditarDieta(null)}
        dieta={editarDieta}
        onGuardar={actualizarDieta}
      />

      <HistoricoTarifasSheet
        open={historicoDieta !== null}
        onOpenChange={(open) => !open && setHistoricoDieta(null)}
        dieta={historicoDieta}
        onRegistrarNuevaTarifa={abrirNuevaTarifa}
      />

      <NuevaTarifaSheet
        open={tarifaDieta !== null}
        onOpenChange={(open) => !open && setTarifaDieta(null)}
        dieta={tarifaDieta}
        onConfirmar={actualizarDieta}
      />

      <DesactivarDietaDialog
        open={desactivarDieta !== null}
        onOpenChange={(open) => !open && setDesactivarDieta(null)}
        dieta={desactivarDieta}
        onConfirmar={actualizarDieta}
      />
    </div>
  )
}
