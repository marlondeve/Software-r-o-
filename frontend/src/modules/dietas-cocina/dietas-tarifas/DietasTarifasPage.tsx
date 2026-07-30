import type { DietaCatalogo } from "@/modules/dietas-cocina/types/catalog"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ActivarDietaDialog } from "@/modules/dietas-cocina/dietas-tarifas/components/ActivarDietaDialog"
import { CrearDietaSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/CrearDietaSheet"
import { DesactivarDietaDialog } from "@/modules/dietas-cocina/dietas-tarifas/components/DesactivarDietaDialog"
import { DietasTarifasTabla } from "@/modules/dietas-cocina/dietas-tarifas/components/DietasTarifasTabla"
import { EditarDietaSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/EditarDietaSheet"
import { HistoricoTarifasSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/HistoricoTarifasSheet"
import { NuevaTarifaSheet } from "@/modules/dietas-cocina/dietas-tarifas/components/NuevaTarifaSheet"
import { crearDietasCatalogoIniciales, TAMANO_PAGINA_CATALOGO } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { mapCatalogoList, mapCatalogoDtoToDieta } from "@/modules/dietas-cocina/api/mappers/catalogo.mapper"
import {
  actualizarDietaCatalogo,
  crearDietaCatalogo,
  desactivarDietaCatalogo,
  invalidarCacheCatalogoDietas,
  obtenerCatalogoDietas,
  registrarTarifaDieta,
} from "@/modules/dietas-cocina/api/services/dietas.service"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { fechaCatalogoAISO } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

export function DietasTarifasPage() {
  const apiActiva = usarApiDietasCocina()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dietas, setDietas] = useState<DietaCatalogo[]>(() =>
    apiActiva ? [] : crearDietasCatalogoIniciales(),
  )
  const [paginaActual, setPaginaActual] = useState(1)

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editarDieta, setEditarDieta] = useState<DietaCatalogo | null>(null)
  const [historicoDieta, setHistoricoDieta] = useState<DietaCatalogo | null>(null)
  const [tarifaDieta, setTarifaDieta] = useState<DietaCatalogo | null>(null)
  const [desactivarDieta, setDesactivarDieta] = useState<DietaCatalogo | null>(null)
  const [activarDieta, setActivarDieta] = useState<DietaCatalogo | null>(null)
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false)

  const recargarCatalogo = useCallback(async () => {
    if (!apiActiva) return
    setCargandoCatalogo(true)
    try {
      const catalogo = await obtenerCatalogoDietas()
      setDietas(mapCatalogoList(catalogo))
    } catch {
      demoToast("No se pudo cargar el catálogo de dietas.", "error")
    } finally {
      setCargandoCatalogo(false)
    }
  }, [apiActiva])

  useEffect(() => {
    void recargarCatalogo()
  }, [recargarCatalogo])

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

  function actualizarDietaLocal(actualizada: DietaCatalogo) {
    setDietas((prev) =>
      prev.map((d) => (d.id === actualizada.id ? actualizada : d)),
    )
  }

  async function guardarDietaApi(
    actualizada: DietaCatalogo,
    fechasIso?: { fechaInicio?: string; fechaFin?: string },
  ) {
    if (!apiActiva) {
      actualizarDietaLocal(actualizada)
      return
    }
    try {
      const fechaInicio =
        fechasIso?.fechaInicio ?? fechaCatalogoAISO(actualizada.fechaInicio)
      const fechaFin =
        fechasIso?.fechaFin ??
        (actualizada.fechaFin
          ? fechaCatalogoAISO(actualizada.fechaFin)
          : undefined)

      await actualizarDietaCatalogo(actualizada.id, {
        nombre: actualizada.nombre,
        descripcion: actualizada.descripcion,
        activa: actualizada.activa,
        ...(fechaInicio ? { fechaInicio } : {}),
        ...(fechaFin ? { fechaFin } : {}),
      })
      await recargarCatalogo()
      invalidarCacheCatalogoDietas()
      demoToast("Dieta actualizada correctamente.", "success")
    } catch (error) {
      demoToast(
        error instanceof Error ? error.message : "No se pudo actualizar la dieta.",
        "error",
      )
      throw error
    }
  }

  function abrirNuevaTarifa(dieta: DietaCatalogo) {
    setHistoricoDieta(null)
    setTarifaDieta(dieta)
  }

  return (
    <div className="space-y-5 pb-6">
      <DashboardPageHeader
        title="Dietas y tarifas"
        subtitle={
          apiActiva
            ? "Catálogo y tarifas sincronizados con POST/PATCH /catalogo."
            : "Gestión general de catálogos y parámetros tarifarios."
        }
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
        onNuevaTarifa={abrirNuevaTarifa}
        onDesactivar={setDesactivarDieta}
        onActivar={setActivarDieta}
      />

      {apiActiva && cargandoCatalogo && dietas.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Cargando catálogo de dietas…
        </p>
      )}

      <CrearDietaSheet
        open={crearAbierto}
        onOpenChange={setCrearAbierto}
        siguienteCodigo={siguienteCodigo}
        onGuardar={async (dieta) => {
          if (!apiActiva) {
            setDietas((prev) => [dieta, ...prev])
            setPaginaActual(1)
            return
          }
          try {
            const fechaInicio = fechaCatalogoAISO(dieta.fechaInicio)
            const fechaFin = dieta.fechaFin
              ? fechaCatalogoAISO(dieta.fechaFin)
              : undefined

            const dto = await crearDietaCatalogo({
              codigo: dieta.codigo,
              nombre: dieta.nombre,
              descripcion: dieta.descripcion,
              activa: dieta.activa,
              tarifaInicial: dieta.tarifaVigente,
              ...(fechaInicio
                ? { fechaInicio, vigenciaDesde: fechaInicio }
                : {}),
              ...(fechaFin ? { fechaFin, vigenciaHasta: fechaFin } : {}),
            })
            setDietas((prev) => [mapCatalogoDtoToDieta(dto, 0), ...prev])
            setPaginaActual(1)
            invalidarCacheCatalogoDietas()
            demoToast("Dieta creada correctamente.", "success")
          } catch (error) {
            demoToast(
              error instanceof Error ? error.message : "No se pudo crear la dieta.",
              "error",
            )
            throw error
          }
        }}
      />

      <EditarDietaSheet
        open={editarDieta !== null}
        onOpenChange={(open) => !open && setEditarDieta(null)}
        dieta={editarDieta}
        onGuardar={guardarDietaApi}
      />

      <HistoricoTarifasSheet
        open={historicoDieta !== null}
        onOpenChange={(open) => !open && setHistoricoDieta(null)}
        dieta={historicoDieta}
        onRegistrarNuevaTarifa={abrirNuevaTarifa}
        soloLectura={false}
      />

      <NuevaTarifaSheet
        open={tarifaDieta !== null}
        onOpenChange={(open) => !open && setTarifaDieta(null)}
        dieta={tarifaDieta}
        onConfirmar={async (dieta, tarifa) => {
          if (!apiActiva) {
            actualizarDietaLocal(dieta)
            return
          }
          try {
            await registrarTarifaDieta(dieta.id, {
              monto: tarifa.monto,
              vigenciaDesde: tarifa.vigenciaDesde,
              vigenciaHasta: tarifa.vigenciaHasta,
              motivoCambio: tarifa.motivoCambio,
            })
            await recargarCatalogo()
            invalidarCacheCatalogoDietas()
            demoToast("Tarifa registrada correctamente.", "success")
          } catch (error) {
            demoToast(
              error instanceof Error ? error.message : "No se pudo registrar la tarifa.",
              "error",
            )
            throw error
          }
        }}
      />

      <DesactivarDietaDialog
        open={desactivarDieta !== null}
        onOpenChange={(open) => !open && setDesactivarDieta(null)}
        dieta={desactivarDieta}
        onConfirmar={async (dieta) => {
          if (!apiActiva) {
            actualizarDietaLocal({ ...dieta, activa: false, estado: "inactiva" })
            return
          }
          try {
            await desactivarDietaCatalogo(dieta.id)
            await recargarCatalogo()
            invalidarCacheCatalogoDietas()
            demoToast("Dieta desactivada correctamente.", "success")
          } catch (error) {
            demoToast(
              error instanceof Error ? error.message : "No se pudo desactivar la dieta.",
              "error",
            )
            throw error
          }
        }}
      />

      <ActivarDietaDialog
        open={activarDieta !== null}
        onOpenChange={(open) => !open && setActivarDieta(null)}
        dieta={activarDieta}
        onConfirmar={async (dieta) => {
          if (!apiActiva) {
            actualizarDietaLocal({ ...dieta, activa: true, estado: "vigente" })
            return
          }
          try {
            await actualizarDietaCatalogo(dieta.id, { activa: true })
            await recargarCatalogo()
            invalidarCacheCatalogoDietas()
            demoToast("Dieta activada correctamente.", "success")
          } catch (error) {
            demoToast(
              error instanceof Error ? error.message : "No se pudo activar la dieta.",
              "error",
            )
            throw error
          }
        }}
      />
    </div>
  )
}
