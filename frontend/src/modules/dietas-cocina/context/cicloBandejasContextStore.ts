import { createContext, useContext } from "react"

import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type {
  ConfirmarDevolucionInput,
  CrearOrdenDesdeDietaInput,
} from "@/modules/dietas-cocina/types/tray-cycle"

export interface CicloBandejasContextValue {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
  buscarPorCodigo: (codigo: string) => EtiquetaEnfermera | undefined
  buscarPorCodigoAsync: (codigo: string) => Promise<EtiquetaEnfermera | undefined>
  getEtiquetaByOrdenId: (ordenId: string) => EtiquetaEnfermera | undefined
  getOrdenByEtiquetaId: (etiquetaId: string) => OrdenCocina | undefined
  marcarEnPreparacion: (ids: string[]) => void
  marcarComoLista: (ids: string[]) => void
  registrarDespacho: (ids: string[]) => void
  generarEtiquetas: (ordenIds: string[]) => Promise<string[]>
  marcarEtiquetasImpresas: (etiquetaIds: string[]) => void
  reimprimirEtiquetas: (etiquetaIds: string[]) => void
  crearOrdenDesdeDieta: (input: CrearOrdenDesdeDietaInput) => string
  cancelarOrdenCocina: (ordenId: string, motivo?: string) => Promise<boolean>
  confirmarPreEntrega: (ids: string[], recibidoPor?: string) => Promise<void>
  confirmarEntrega: (id: string) => void
  confirmarDevolucion: (id: string, input: ConfirmarDevolucionInput) => Promise<void>
  contarRecibidasEnfermeria: () => number
  actualizarChecklist: (
    ordenId: string,
    checklistId: string,
    completado: boolean,
  ) => void
  hidrato: boolean
  rehidratarDesdeStorage: () => void
  sincronizarOrdenesDesdeFilas: (filas: FilaDieta[]) => void
}

export const CicloBandejasContext = createContext<CicloBandejasContextValue | null>(
  null,
)

export function useCicloBandejas(): CicloBandejasContextValue {
  const ctx = useContext(CicloBandejasContext)
  if (!ctx) {
    throw new Error(
      "useCicloBandejas debe usarse dentro de CicloBandejasProvider",
    )
  }
  return ctx
}

export function useCicloBandejasOpcional() {
  return useContext(CicloBandejasContext)
}
