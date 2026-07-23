export const TAMANO_PAGINA_AUDITORIA = 3

export function exportarAuditoriaCsv(
  filas: {
    fechaHora: string
    codigoAuditoria: string
    usuario: { nombre: string; rol: string }
    modulo: string
    accion: string
    registroId: string
    resultado: string
  }[],
) {
  const encabezados = [
    "Fecha y hora",
    "Código auditoría",
    "Usuario",
    "Rol",
    "Módulo",
    "Acción",
    "Registro",
    "Resultado",
  ]

  const lineas = filas.map((fila) =>
    [
      fila.fechaHora,
      fila.codigoAuditoria,
      fila.usuario.nombre,
      fila.usuario.rol,
      fila.modulo,
      fila.accion,
      fila.registroId,
      fila.resultado,
    ]
      .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
      .join(","),
  )

  return [encabezados.join(","), ...lineas].join("\n")
}
