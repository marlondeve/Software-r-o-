import type { LucideIcon } from "lucide-react"
import {
  FileQuestion,
  FileSearch,
  LayoutGrid,
  ListChecks,
  LogOut,
  Phone,
  Settings,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import { ClinicaLogo } from "@/components/layout/ClinicaLogo"
import { AppBrandName } from "@/components/layout/AppBrandName"
import { AppLegalFooter } from "@/components/layout/AppLegalFooter"
import { ScrollAreaFlex } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import {
  obtenerNavAdminDietas,
  obtenerNavDietasAgrupado,
} from "@/modules/dietas-cocina/lib/navDietas"
import { useMatrizPermisosVersion } from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { cn } from "@/lib/utils"
import type { ModuloId } from "@/types/module"

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

const moduleBranding: Record<ModuleType, { subtitulo: string }> = {
  "dietas-cocina": {
    subtitulo: "Gestión de Dietas",
  },
  encuestas: {
    subtitulo: "Encuestas",
  },
}

const mainNavItems: Record<ModuleType, NavItem[]> = {
  "dietas-cocina": [],
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

function SidebarNavItem({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  const location = useLocation()

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) => {
        const activo =
          isActive ||
          (item.to !== "/dietas-cocina/inicio" &&
            location.pathname.startsWith(item.to))
        return cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          activo
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )
      }}
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
  const { cerrarSesion } = useAuth()
  useConfigAccesoModulos()
  useMatrizPermisosVersion()
  const branding = moduleBranding[module]
  const rolVistaEfectivo = useRolVistaEfectivo()
  const rolDietas = module === "dietas-cocina" ? rolVistaEfectivo : null
  const gruposDietas =
    module === "dietas-cocina" && rolDietas
      ? obtenerNavDietasAgrupado(rolDietas)
      : []
  const adminDietas =
    module === "dietas-cocina" && rolDietas
      ? obtenerNavAdminDietas(rolDietas)
      : []
  const navEncuestas = module === "encuestas" ? mainNavItems.encuestas : []

  function handleLogout() {
    void (async () => {
      await cerrarSesion()
      navigate("/login", { replace: true })
      onNavigate?.()
    })()
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-sidebar px-3 py-4",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-2.5">
        <ClinicaLogo className="h-9 w-auto" />
        <div className="min-w-0 pt-0.5">
          <p className="text-base leading-none font-bold">
            <AppBrandName />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {branding.subtitulo}
          </p>
        </div>
      </div>

      <Separator className="mb-3" />

      <ScrollAreaFlex>
        <nav className="flex flex-col gap-3 pr-2">
          {module === "dietas-cocina"
            ? gruposDietas.map((grupo) => (
                <div key={grupo.id} className="space-y-0.5">
                  <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {grupo.titulo}
                  </p>
                  {grupo.items.map((item) => (
                    <SidebarNavItem
                      key={item.to}
                      item={item}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              ))
            : navEncuestas.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
        </nav>
      </ScrollAreaFlex>

      <Separator className="mb-3" />

      <nav className="flex flex-col gap-0.5">
        {module === "dietas-cocina"
          ? adminDietas.map((item) => (
              <SidebarNavItem
                key={item.to}
                item={item}
                onNavigate={onNavigate}
              />
            ))
          : (
            <>
              <SidebarNavItem
                item={{
                  label: "Parámetros",
                  to: `/${module}/parametros`,
                  icon: Settings,
                }}
                onNavigate={onNavigate}
              />
              <SidebarNavItem
                item={{
                  label: "Usuarios y roles",
                  to: `/${module}/usuarios`,
                  icon: Users,
                }}
                onNavigate={onNavigate}
              />
              <SidebarNavItem
                item={{
                  label: "Auditoría",
                  to: `/${module}/auditoria`,
                  icon: FileSearch,
                }}
                onNavigate={onNavigate}
              />
            </>
          )}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </nav>

      <AppLegalFooter variant="compact" className="mt-1 border-t border-sidebar-border" />
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
