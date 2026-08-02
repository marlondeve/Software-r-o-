import type { DetalleAuditoria, FilaAuditoria } from "@/modules/dietas-cocina/types/audit"
export function obtenerDetalleAuditoria(
  id: string,
  filas: FilaAuditoria[],
  detalles: Record<string, DetalleAuditoria>,
): DetalleAuditoria | null {
  const detalleGuardado = detalles[id]
  if (detalleGuardado) return detalleGuardado

  const fila = filas.find((item) => item.id === id)
  if (!fila) return null

  return construirDetalleDesdeFila(fila)
}

function construirDetalleDesdeFila(fila: FilaAuditoria): DetalleAuditoria {
  const base: DetalleAuditoria = {
    codigoAuditoria: fila.codigoAuditoria,
    usuario: {
      nombre: fila.usuario.nombre,
      area: fila.usuario.rol,
      iniciales: fila.usuario.iniciales,
      esSistema: fila.usuario.esSistema,
    },
    fechaHora: fila.fechaHora,
    entidad: {
      etiqueta: `Registro ${fila.registroId}`,
    },
    metadatos: {
      ip: "—",
      dispositivo: "—",
      sistema: "Módulo Dietas y Cocina v2.1",
    },
    historial: [
      {
        titulo: fila.accion,
        tiempo: fila.fechaHora,
        actual: true,
      },
    ],
  }

  if (fila.resultado === "fallido") {
    return {
      ...base,
      mensajeError:
        fila.cambios.texto ??
        "La operación no pudo completarse por restricciones del módulo.",
    }
  }

  if (fila.cambios.tipo === "diff" && fila.cambios.lineas?.length) {
    const cambiosLegibles = fila.cambios.lineas.map((linea) => {
      const match = linea.texto.match(/^([^:]+):\s*(.+)$/)
      if (match) {
        return linea.prefijo === "-"
          ? { campo: match[1]!.trim(), anterior: match[2]!.trim() }
          : { campo: match[1]!.trim(), nuevo: match[2]!.trim() }
      }
      return linea.prefijo === "-"
        ? { campo: fila.accion, anterior: linea.texto }
        : { campo: fila.accion, nuevo: linea.texto }
    })

    const resumen =
      fila.cambios.resumen ??
      fila.cambios.lineas.map((l) => l.texto).join(" · ")

    return {
      ...base,
      parametro: fila.accion,
      resumenCambios: resumen,
      cambiosLegibles,
    }
  }

  return {
    ...base,
    justificacion: fila.cambios.texto,
  }
}
