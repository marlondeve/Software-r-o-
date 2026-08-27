import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { mockEnfermera } from "@/modules/dietas-cocina/inicio/datos/mockEnfermera"
import { estadoDietaDesdeCiclo } from "@/modules/dietas-cocina/lib/mapearEstadoDietaOrden"
import { deduplicarFilasPorPacienteComida } from "@/modules/dietas-cocina/lib/fusionarFilasDieta"
import {
  filtrarEtiquetasDelPeriodoOperativo,
  resolverContextoFilaDieta,
} from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import {
  formatearPeriodoOperativo,
} from "@/modules/dietas-cocina/lib/resolverPeriodoOperativoNutricionista"

function filasEnfermeria(
  filas: FilaDieta[],
  comida: TiempoComida,
): FilaDieta[] {
  let filtradas = filas.filter((f) => f.comida === comida)
  if (filtradas.length === 0 && filas.length > 0) {
    filtradas = filas
  }
  return deduplicarFilasPorPacienteComida(filtradas)
}

export function construirDashboardEnfermeraDesdeCiclo(
  filas: FilaDieta[],
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  comida: TiempoComida = "almuerzo",
) {
  const filasPiso = filasEnfermeria(filas, comida)
  const etiquetasPeriodo = filtrarEtiquetasDelPeriodoOperativo(etiquetas, {
    comida,
  })
  const resolverEstado = (fila: FilaDieta) => {
    const { orden, etiqueta } = resolverContextoFilaDieta(
      fila,
      ordenes,
      etiquetasPeriodo,
    )
    return estadoDietaDesdeCiclo(fila, orden, etiqueta)
  }

  const pendientes = filasPiso.filter((f) =>
    ["no-solicitada", "guardado"].includes(resolverEstado(f)),
  ).length

  const confirmadas = filasPiso.filter((f) =>
    ["confirmada", "recibida", "recogida", "por-iniciar", "en-preparacion", "lista-despacho", "despachada"].includes(
      resolverEstado(f),
    ),
  ).length

  const novedades = filasPiso.filter(
    (f) =>
      resolverEstado(f) === "guardado" ||
      (f.alergico && resolverEstado(f) !== "cancelada"),
  ).length

  const dietasRecientes = filasPiso
    .slice(0, 4)
    .map((fila) => {
      const estado = resolverEstado(fila)
      return {
        habitacion: fila.habitacion,
        paciente: fila.paciente,
        tipo: fila.tipoDieta ?? "Sin asignar",
        estado,
        observaciones: fila.observaciones,
        cancelacionPorSalidaClinica: fila.cancelacionPorSalidaClinica,
        salidaClinicaSostenida: fila.salidaClinicaSostenida,
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
    servicioEnCurso: formatearPeriodoOperativo(),
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
