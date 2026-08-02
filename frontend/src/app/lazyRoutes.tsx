import type { ComponentType } from "react"

import { lazyPage } from "@/app/lazyPage"
import {
  CapturaEncuestaSkeleton,
  DashboardPageSkeleton,
  DietasOperativaPageSkeleton,
  EditorPageSkeleton,
  FlowCardSkeleton,
  ParametrosPageSkeleton,
  ReportesPageSkeleton,
  SectionPageSkeleton,
  TablePageSkeleton,
  TabsSkeleton,
} from "@/components/shared/skeletons"

type PageModule = ComponentType<Record<string, unknown>>

function asPage(component: ComponentType): PageModule {
  return component as PageModule
}

function FallbackSectionPage() {
  return <SectionPageSkeleton />
}

function FallbackDashboardPage() {
  return <DashboardPageSkeleton />
}

function FallbackTablePage() {
  return <TablePageSkeleton />
}

function FallbackDietasOperativaPage() {
  return <DietasOperativaPageSkeleton />
}

function FallbackReportesPage() {
  return <ReportesPageSkeleton />
}

function FallbackParametrosPage() {
  return <ParametrosPageSkeleton />
}

function FallbackFlowCard() {
  return <FlowCardSkeleton />
}

function FallbackCapturaEncuesta() {
  return <CapturaEncuestaSkeleton />
}

function FallbackEditorPage() {
  return <EditorPageSkeleton />
}

function FallbackTabs() {
  return <TabsSkeleton />
}

function loadPage(
  importFn: () => Promise<{ default: ComponentType }>,
  Fallback: ComponentType,
) {
  return lazyPage(
    () => importFn().then((m) => ({ default: asPage(m.default) })),
    Fallback,
  )
}

// —— Administración ——
export const LazyUsuariosAdminPage = loadPage(
  () =>
    import("@/features/administracion/usuarios/UsuariosPage").then((m) => ({
      default: m.UsuariosPage,
    })),
  FallbackSectionPage,
)

export const LazyRolesAdminPage = loadPage(
  () =>
    import("@/features/administracion/roles/RolesPage").then((m) => ({
      default: m.RolesPage,
    })),
  FallbackSectionPage,
)

export const LazyPermisosAdminPage = loadPage(
  () =>
    import("@/features/administracion/permisos/PermisosPage").then((m) => ({
      default: m.PermisosPage,
    })),
  FallbackSectionPage,
)

// —— Encuestas ——
export const LazyInicioEncuestasPage = loadPage(
  () =>
    import("@/modules/encuestas/inicio/InicioPage").then((m) => ({
      default: m.InicioPage,
    })),
  FallbackDashboardPage,
)

export const LazyIdentificacionPacientePage = loadPage(
  () =>
    import("@/modules/encuestas/identificacion-paciente/IdentificacionPacientePage").then(
      (m) => ({ default: m.IdentificacionPacientePage }),
    ),
  FallbackCapturaEncuesta,
)

export const LazyCapturaPresencialPage = loadPage(
  () =>
    import("@/modules/encuestas/captura-presencial/CapturaPresencialPage").then(
      (m) => ({ default: m.CapturaPresencialPage }),
    ),
  FallbackCapturaEncuesta,
)

export const LazyCapturaTelefonicaPage = loadPage(
  () =>
    import("@/modules/encuestas/captura-telefonica/CapturaTelefonicaPage").then(
      (m) => ({ default: m.CapturaTelefonicaPage }),
    ),
  FallbackCapturaEncuesta,
)

export const LazyEncuestasRealizadasPage = loadPage(
  () =>
    import("@/modules/encuestas/encuestas-realizadas/EncuestasRealizadasPage").then(
      (m) => ({ default: m.EncuestasRealizadasPage }),
    ),
  FallbackTablePage,
)

export const LazyCuestionariosPage = loadPage(
  () =>
    import("@/modules/encuestas/cuestionarios/CuestionariosPage").then((m) => ({
      default: m.CuestionariosPage,
    })),
  FallbackTablePage,
)

export const LazyEditorCuestionarioPage = loadPage(
  () =>
    import("@/modules/encuestas/editor-cuestionario/EditorCuestionarioPage").then(
      (m) => ({ default: m.EditorCuestionarioPage }),
    ),
  FallbackEditorPage,
)

export const LazyIndicadoresPage = loadPage(
  () =>
    import("@/modules/encuestas/indicadores/IndicadoresPage").then((m) => ({
      default: m.IndicadoresPage,
    })),
  FallbackTabs,
)

export const LazyAnalisisBrechasPage = loadPage(
  () =>
    import("@/modules/encuestas/analisis-brechas/AnalisisBrechasPage").then(
      (m) => ({ default: m.AnalisisBrechasPage }),
    ),
  FallbackDashboardPage,
)

export const LazyParametrosEncuestasPage = loadPage(
  () =>
    import("@/modules/encuestas/parametros/ParametrosPage").then((m) => ({
      default: m.ParametrosPage,
    })),
  FallbackParametrosPage,
)

export const LazyUsuariosRolesEncuestasPage = loadPage(
  () =>
    import("@/modules/encuestas/usuarios/UsuariosRolesPage").then((m) => ({
      default: m.UsuariosRolesPage,
    })),
  FallbackTablePage,
)

export const LazyAuditoriaEncuestasPage = loadPage(
  () =>
    import("@/modules/encuestas/auditoria/AuditoriaPage").then((m) => ({
      default: m.AuditoriaPage,
    })),
  FallbackTablePage,
)

export const LazyCapturaEncuestaPage = loadPage(
  () =>
    import("@/modules/encuestas/captura-encuesta/CapturaEncuestaPage").then(
      (m) => ({ default: m.CapturaEncuestaPage }),
    ),
  FallbackCapturaEncuesta,
)

export const LazyEncuestaRegistradaPage = loadPage(
  () =>
    import("@/modules/encuestas/captura-encuesta/EncuestaRegistradaPage").then(
      (m) => ({ default: m.EncuestaRegistradaPage }),
    ),
  FallbackFlowCard,
)

// —— Dietas-cocina ——
export const LazyInicioDietasPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/inicio/InicioPage").then((m) => ({
      default: m.InicioPage,
    })),
  FallbackDashboardPage,
)

export const LazyDietasPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/dietas/DietasPage").then((m) => ({
      default: m.DietasPage,
    })),
  FallbackDietasOperativaPage,
)

export const LazyDietasTarifasPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/dietas-tarifas/DietasTarifasPage").then(
      (m) => ({ default: m.DietasTarifasPage }),
    ),
  FallbackTablePage,
)

export const LazyCocinaPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/cocina/CocinaPage").then((m) => ({
      default: m.CocinaPage,
    })),
  FallbackTablePage,
)

export const LazyImpresionEtiquetasPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/impresion-etiquetas/ImpresionEtiquetasPage").then(
      (m) => ({ default: m.ImpresionEtiquetasPage }),
    ),
  FallbackTablePage,
)

export const LazyRecepcionProveedorPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/recepcion-proveedor/RecepcionProveedorPage").then(
      (m) => ({ default: m.RecepcionProveedorPage }),
    ),
  FallbackFlowCard,
)

export const LazyPreEntregaFlowPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/etiquetas/views/PreEntregaFlowPage").then(
      (m) => ({ default: m.PreEntregaFlowPage }),
    ),
  FallbackFlowCard,
)

export const LazyCicloFinalizadoPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/etiquetas/views/CicloFinalizadoPage").then(
      (m) => ({ default: m.CicloFinalizadoPage as ComponentType }),
    ),
  FallbackFlowCard,
)

export const LazyBandejasPisoPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/bandejas-piso/BandejasPisoPage").then(
      (m) => ({ default: m.BandejasPisoPage }),
    ),
  FallbackFlowCard,
)

export const LazyEtiquetaConsultaPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/etiquetas/views/EtiquetaConsultaPage").then(
      (m) => ({ default: m.EtiquetaConsultaPage }),
    ),
  FallbackFlowCard,
)

export const LazyEntregaFlowPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/etiquetas/views/EntregaFlowPage").then(
      (m) => ({ default: m.EntregaFlowPage }),
    ),
  FallbackFlowCard,
)

export const LazyDevolucionFlowPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/etiquetas/views/DevolucionFlowPage").then(
      (m) => ({ default: m.DevolucionFlowPage }),
    ),
  FallbackFlowCard,
)

export const LazyReportesClinicosPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/reportes-clinicos/ReportesClinicosPage").then(
      (m) => ({ default: m.ReportesClinicosPage }),
    ),
  FallbackReportesPage,
)

export const LazyReportesProduccionPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/reportes-produccion/ReportesProduccionPage").then(
      (m) => ({ default: m.ReportesProduccionPage }),
    ),
  FallbackReportesPage,
)

export const LazyConciliacionPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/conciliacion/ConciliacionPage").then(
      (m) => ({ default: m.ConciliacionPage }),
    ),
  FallbackTablePage,
)

export const LazyTiemposRestriccionesView = loadPage(
  () =>
    import("@/modules/dietas-cocina/parametros/views/TiemposRestriccionesView").then(
      (m) => ({ default: m.TiemposRestriccionesView }),
    ),
  FallbackParametrosPage,
)

export const LazyTiposPacienteView = loadPage(
  () =>
    import("@/modules/dietas-cocina/parametros/views/TiposPacienteView").then(
      (m) => ({ default: m.TiposPacienteView }),
    ),
  FallbackTablePage,
)

export const LazyAuditoriaDietasPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/auditoria/AuditoriaPage").then((m) => ({
      default: m.AuditoriaPage,
    })),
  FallbackTablePage,
)

export const LazyUsuariosRolesPage = loadPage(
  () =>
    import("@/modules/dietas-cocina/usuarios/UsuariosRolesPage").then((m) => ({
      default: m.UsuariosRolesPage,
    })),
  FallbackTablePage,
)
