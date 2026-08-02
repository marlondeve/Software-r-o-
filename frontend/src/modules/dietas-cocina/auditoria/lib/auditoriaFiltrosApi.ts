import type { ModuloAuditoria } from "@/modules/dietas-cocina/types/enums"
import type { FiltrosAuditoria } from "@/modules/dietas-cocina/api/services/auditoria.service"
import { MODULO_UI_A_API } from "@/modules/dietas-cocina/auditoria/lib/auditoriaCatalogo"

export function moduloUiToApi(modulo: string): string | undefined {
  if (modulo === "todos") return undefined
  return MODULO_UI_A_API[modulo as ModuloAuditoria] ?? modulo
}

export function accionUiToApi(accion: string): string | undefined {
  if (accion === "todas") return undefined
  return accion
}

export function actorUiToApi(actor: string): string | undefined {
  if (actor === "todos") return undefined
  if (actor === "usuario") return "usuario"
  if (actor === "sistema") return "sistema"
  return undefined
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
    accionUi?: string
    actorUi?: string
    resultadoUi?: string
  },
): Record<string, string | number | undefined> {
  return {
    page: filtros.page,
    pageSize: filtros.pageSize,
    modulo: filtros.modulo ?? (filtros.moduloUi ? moduloUiToApi(filtros.moduloUi) : undefined),
    accion: filtros.accion ?? (filtros.accionUi ? accionUiToApi(filtros.accionUi) : undefined),
    actor: filtros.actor ?? (filtros.actorUi ? actorUiToApi(filtros.actorUi) : undefined),
    resultado:
      filtros.resultado ??
      (filtros.resultadoUi ? resultadoUiToApi(filtros.resultadoUi) : undefined),
    desde: filtros.desde,
    hasta: filtros.hasta,
    usuario: filtros.usuario?.trim() || undefined,
  }
}
