import type {
  DetalleAuditoria,
  FilaAuditoria,
} from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"

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
    const anterior = fila.cambios.lineas.find((l) => l.prefijo === "-")
    const nuevo = fila.cambios.lineas.find((l) => l.prefijo === "+")
    return {
      ...base,
      parametro: fila.accion,
      valorAnterior: anterior?.texto.replace(/^[^:]+:\s*/, "") ?? "—",
      valorNuevo: nuevo?.texto.replace(/^[^:]+:\s*/, "") ?? "—",
    }
  }

  return {
    ...base,
    justificacion: fila.cambios.texto,
  }
}
