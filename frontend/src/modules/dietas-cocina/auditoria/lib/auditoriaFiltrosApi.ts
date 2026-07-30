import type { ModuloAuditoria } from "@/modules/dietas-cocina/types/enums"
import type { FiltrosAuditoria } from "@/modules/dietas-cocina/api/services/auditoria.service"

const MODULO_UI_A_API: Record<ModuloAuditoria | string, string> = {
  dietas: "Dietas",
  cocina: "Ordenes",
  etiquetas: "Etiquetas",
  reportes: "Reportes",
  conciliacion: "Conciliacion",
  parametros: "Parametros",
  usuarios: "Usuarios",
  inicio: "Inicio",
  catalogo: "Catalogo",
  roles: "Roles",
}

export function moduloUiToApi(modulo: string): string | undefined {
  if (modulo === "todos") return undefined
  return MODULO_UI_A_API[modulo] ?? modulo
}

export function resultadoUiToApi(resultado: string): string | undefined {
  if (resultado === "todos") return undefined
  if (resultado === "exitoso") return "Exitoso"
  if (resultado === "fallido") return "Fallido"
  return resultado
}

export function construirParamsAuditoriaApi(
  filtros: FiltrosAuditoria & {
    moduloUi?: string
    resultadoUi?: string
  },
): Record<string, string | number | undefined> {
  return {
    page: filtros.page,
    pageSize: filtros.pageSize,
    modulo: filtros.modulo ?? (filtros.moduloUi ? moduloUiToApi(filtros.moduloUi) : undefined),
    resultado:
      filtros.resultado ??
      (filtros.resultadoUi ? resultadoUiToApi(filtros.resultadoUi) : undefined),
    desde: filtros.desde,
    hasta: filtros.hasta,
    usuario: filtros.usuario?.trim() || undefined,
  }
}
