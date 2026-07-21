import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  ChefHat,
  FileQuestion,
  FileSearch,
  LayoutGrid,
  ListChecks,
  LogOut,
  Phone,
  QrCode,
  Settings,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"

import { ClinicaLogo } from "@/components/layout/ClinicaLogo"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { usuarioEsAdministrador } from "@/lib/modulos"
import { cn } from "@/lib/utils"
import type { ModuloId } from "@/tipos/modulo"
import type { Usuario } from "@/tipos/usuario"

export type ModuleType = ModuloId

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

interface SidebarContentProps {
  module: ModuleType
  className?: string
  onNavigate?: () => void
}

const moduleBranding: Record<
  ModuleType,
  { titulo: string; subtitulo: string }
> = {
  "dietas-cocina": {
    titulo: "Bital",
    subtitulo: "Gestión de Dietas",
  },
  encuestas: {
    titulo: "Bital",
    subtitulo: "Encuestas",
  },
}

const mainNavItems: Record<ModuleType, NavItem[]> = {
  "dietas-cocina": [
    { label: "Inicio", to: "/dietas-cocina/inicio", icon: LayoutGrid },
    {
      label: "Gestión de dietas",
      to: "/dietas-cocina/dietas",
      icon: UtensilsCrossed,
    },
    {
      label: "Cocina y seguimiento",
      to: "/dietas-cocina/cocina",
      icon: ChefHat,
    },
    { label: "Etiquetas", to: "/dietas-cocina/etiquetas", icon: QrCode },
    { label: "Reportes", to: "/dietas-cocina/reportes", icon: BarChart3 },
    {
      label: "Conciliación",
      to: "/dietas-cocina/conciliacion",
      icon: Wallet,
    },
  ],
  encuestas: [
    { label: "Inicio", to: "/encuestas/inicio", icon: LayoutGrid },
    {
      label: "Captura presencial",
      to: "/encuestas/captura-presencial",
      icon: UserCheck,
    },
    {
      label: "Captura telefónica",
      to: "/encuestas/captura-telefonica",
      icon: Phone,
    },
    {
      label: "Encuestas realizadas",
      to: "/encuestas/encuestas-realizadas",
      icon: ListChecks,
    },
    {
      label: "Cuestionarios",
      to: "/encuestas/cuestionarios",
      icon: FileQuestion,
    },
    {
      label: "Indicadores",
      to: "/encuestas/indicadores",
      icon: TrendingUp,
    },
  ],
}

function bottomNavItems(module: ModuleType, usuario: Usuario | null): NavItem[] {
  const items: NavItem[] = [
    {
      label: "Parámetros",
      to: `/${module}/parametros`,
      icon: Settings,
    },
  ]

  if (usuarioEsAdministrador(usuario)) {
    items.push({
      label: "Usuarios y roles",
      to: "/administracion/usuarios",
      icon: Users,
    })
  }

  items.push({
    label: "Auditoría",
    to: `/${module}/auditoria`,
    icon: FileSearch,
  })

  return items
}

function SidebarNavItem({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      <span className="leading-tight">{item.label}</span>
    </NavLink>
  )
}

export function SidebarContent({
  module,
  className,
  onNavigate,
}: SidebarContentProps) {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()
  const branding = moduleBranding[module]

  function handleLogout() {
    cerrarSesion()
    navigate("/login", { replace: true })
    onNavigate?.()
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar px-3 py-4",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-2.5">
        <ClinicaLogo className="h-9 w-auto" />
        <div className="min-w-0 pt-0.5">
          <p className="text-base leading-none font-bold text-primary">
            {branding.titulo}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {branding.subtitulo}
          </p>
        </div>
      </div>

      <Separator className="mb-3" />

      <nav className="flex flex-col gap-0.5 overflow-y-auto">
        {mainNavItems[module].map((item) => (
          <SidebarNavItem
            key={item.to}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="flex-1" />

      <Separator className="mb-3" />

      <nav className="flex flex-col gap-0.5">
        {bottomNavItems(module, usuario).map((item) => (
          <SidebarNavItem
            key={item.to}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </nav>
    </div>
  )
}

export function Sidebar({ module }: { module: ModuleType }) {
  return (
    <aside
      className="hidden h-full shrink-0 border-r border-sidebar-border lg:flex"
      style={{ width: "var(--sidebar-width)" }}
    >
      <SidebarContent module={module} className="w-full" />
    </aside>
  )
}
