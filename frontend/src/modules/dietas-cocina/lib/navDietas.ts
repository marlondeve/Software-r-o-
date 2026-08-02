import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  BookOpen,
  ChefHat,
  FileSearch,
  LayoutGrid,
  PackageCheck,
  Printer,
  Settings,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"

import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_LOGISTICA } from "@/modules/dietas-cocina/lib/rutasLogistica"
import { RUTAS_REPORTES } from "@/modules/dietas-cocina/lib/rutasReportes"
import { rutaDietasPermitida } from "@/modules/dietas-cocina/lib/permisos"

export interface NavItemDietas {
  id: RutaDietasConfig
  label: string
  to: string
  icon: LucideIcon
}

export interface NavGrupoDietas {
  id: string
  titulo: string
  items: NavItemDietas[]
}

type NavItemDef = {
  id: RutaDietasConfig
  label: string
  to: string
  icon: LucideIcon
}

const DEFINICION_GRUPOS: { id: string; titulo: string; items: NavItemDef[] }[] = [
  {
    id: "general",
    titulo: "General",
    items: [
      { id: "inicio", label: "Inicio", to: "/dietas-cocina/inicio", icon: LayoutGrid },
    ],
  },
  {
    id: "clinica",
    titulo: "Clínica y nutrición",
    items: [
      {
        id: "dietas",
        label: "Gestión de dietas",
        to: "/dietas-cocina/dietas",
        icon: UtensilsCrossed,
      },
      {
        id: "dietas-tarifas",
        label: "Dietas y tarifas",
        to: "/dietas-cocina/dietas-tarifas",
        icon: BookOpen,
      },
      {
        id: "conciliacion",
        label: "Conciliación",
        to: "/dietas-cocina/conciliacion",
        icon: Wallet,
      },
    ],
  },
  {
    id: "produccion",
    titulo: "Producción y despacho",
    items: [
      {
        id: "cocina",
        label: "Cocina y seguimiento",
        to: "/dietas-cocina/cocina",
        icon: ChefHat,
      },
      {
        id: "impresion-etiquetas",
        label: "Impresión de etiquetas",
        to: RUTAS_LOGISTICA.impresion,
        icon: Printer,
      },
    ],
  },
  {
    id: "piso",
    titulo: "Logística en piso",
    items: [
      {
        id: "recepcion-proveedor",
        label: "Recepción del proveedor",
        to: RUTAS_LOGISTICA.recepcion,
        icon: Truck,
      },
      {
        id: "bandejas-piso",
        label: "Bandejas en piso",
        to: RUTAS_LOGISTICA.piso,
        icon: PackageCheck,
      },
    ],
  },
  {
    id: "indicadores",
    titulo: "Indicadores",
    items: [
      {
        id: "reportes-clinicos",
        label: "Reportes clínicos",
        to: RUTAS_REPORTES.clinico,
        icon: BarChart3,
      },
      {
        id: "reportes-produccion",
        label: "Reportes de producción",
        to: RUTAS_REPORTES.produccion,
        icon: TrendingUp,
      },
    ],
  },
]

export function obtenerNavDietasAgrupado(rol: string | null): NavGrupoDietas[] {
  return DEFINICION_GRUPOS.map((grupo) => ({
    id: grupo.id,
    titulo: grupo.titulo,
    items: grupo.items
      .filter((item) => rutaDietasPermitida(rol, item.id))
      .map((item) => ({
        id: item.id,
        label: item.label,
        to: item.to,
        icon: item.icon,
      })),
  })).filter((grupo) => grupo.items.length > 0)
}

export function obtenerNavAdminDietas(rol: string | null): NavItemDietas[] {
  const items: NavItemDietas[] = []
  if (rutaDietasPermitida(rol, "parametros")) {
    items.push({
      id: "parametros",
      label: "Parámetros",
      to: "/dietas-cocina/parametros",
      icon: Settings,
    })
  }
  if (rutaDietasPermitida(rol, "usuarios")) {
    items.push({
      id: "usuarios",
      label: "Usuarios y roles",
      to: "/dietas-cocina/usuarios",
      icon: Users,
    })
  }
  if (rutaDietasPermitida(rol, "auditoria")) {
    items.push({
      id: "auditoria",
      label: "Auditoría",
      to: "/dietas-cocina/auditoria",
      icon: FileSearch,
    })
  }
  return items
}
