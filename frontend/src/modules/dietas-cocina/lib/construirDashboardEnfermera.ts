import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { mockEnfermera } from "@/modules/dietas-cocina/inicio/datos/mockEnfermera"
import { estadoDietaDesdeCiclo } from "@/modules/dietas-cocina/lib/mapearEstadoDietaOrden"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

/** Pabellones asociados al piso de enfermería demo. */
const PABELLONES_ENFERMERIA = ["Pab. Central", "Pab. Norte"]

function filasEnfermeria(
  filas: FilaDieta[],
  comida: TiempoComida,
): FilaDieta[] {
  return filas.filter(
    (f) => f.comida === comida && PABELLONES_ENFERMERIA.includes(f.pabellon),
  )
}

export function construirDashboardEnfermeraDesdeCiclo(
  filas: FilaDieta[],
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  comida: TiempoComida = "almuerzo",
) {
  const ordenPorId = new Map(ordenes.map((o) => [o.id, o]))
  const etiquetaPorOrden = new Map<string, EtiquetaEnfermera>()
  for (const orden of ordenes) {
    if (!orden.etiquetaId) continue
    const etiqueta = etiquetas.find((e) => e.id === orden.etiquetaId)
    if (etiqueta) etiquetaPorOrden.set(orden.id, etiqueta)
  }

  const filasPiso = filasEnfermeria(filas, comida)

  const pendientes = filasPiso.filter((f) =>
    ["no-solicitada", "guardado"].includes(f.estado),
  ).length

  const confirmadas = filasPiso.filter((f) =>
    ["confirmada", "recibida", "por-iniciar", "en-preparacion", "lista-despacho", "despachada"].includes(
      f.estado,
    ),
  ).length

  const novedades = filasPiso.filter(
    (f) => f.estado === "guardado" || (f.alergico && f.estado !== "cancelada"),
  ).length

  const dietasRecientes = filasPiso
    .filter((f) => !["no-solicitada", "cancelada"].includes(f.estado))
    .slice(0, 4)
    .map((fila) => {
      const orden = fila.ordenCocinaId
        ? ordenPorId.get(fila.ordenCocinaId)
        : undefined
      const etiqueta = fila.ordenCocinaId
        ? etiquetaPorOrden.get(fila.ordenCocinaId)
        : undefined
      const estado = estadoDietaDesdeCiclo(fila.estado, orden, etiqueta)
      return {
        habitacion: fila.habitacion,
        paciente: fila.paciente,
        tipo: fila.tipoDieta ?? "Sin asignar",
        estado,
      }
    })

  const alertas: Array<{
    habitacion: string
    titulo: string
    descripcion: string
  }> = []

  for (const fila of filasPiso) {
    if (fila.alergico && fila.alergias) {
      alertas.push({
        habitacion: fila.habitacion,
        titulo: "Alergia reportada",
        descripcion: `Alergia a ${fila.alergias}.`,
      })
    }
    if (fila.aislado || fila.aislamiento !== "Ninguno") {
      alertas.push({
        habitacion: fila.habitacion,
        titulo: "Paciente aislado",
        descripcion:
          fila.observacionAislamiento ||
          `Aislamiento: ${fila.aislamiento}.`,
      })
    }
    const obs = fila.observaciones.toLowerCase()
    if (obs.includes("ayuno") || obs.includes("cirugía")) {
      alertas.push({
        habitacion: fila.habitacion,
        titulo: "Ayuno / procedimiento",
        descripcion: fila.observaciones,
      })
    }
  }

  const alertasUnicas = alertas.slice(0, 4)

  return {
    piso: mockEnfermera.piso,
    servicioEnCurso: mockEnfermera.servicioEnCurso,
    kpis: [
      { label: "Solicitudes pendientes", value: pendientes },
      { label: "Dietas confirmadas", value: confirmadas },
      {
        label: "Novedades de hoy",
        value: novedades,
        alert: novedades > 0,
      },
    ],
    dietasRecientes:
      dietasRecientes.length > 0
        ? dietasRecientes
        : mockEnfermera.dietasRecientes,
    alertas:
      alertasUnicas.length > 0 ? alertasUnicas : mockEnfermera.alertas,
    contactoNutricion: mockEnfermera.contactoNutricion,
  }
}
