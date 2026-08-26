import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  deduplicarFilasPorPacienteComida,
  mismaIdentidadPacienteDieta,
} from "@/modules/dietas-cocina/lib/fusionarFilasDieta"

/** Reemplaza el censo de una comida con datos del HIS, conservando estado operativo local. */
export function fusionarCensoOperativo(
  anteriores: FilaDieta[],
  delApi: Omit<FilaDieta, "id">[],
  comida: TiempoComida,
): { filas: FilaDieta[]; totalEnCenso: number } {
  const otrasComidas = anteriores.filter((fila) => fila.comida !== comida)
  const anterioresComida = anteriores.filter((fila) => fila.comida === comida)
  const porPacienteId = new Map(
    anterioresComida.map((fila) => [fila.pacienteId, fila]),
  )

  // Las filas legadas guardan el documento en otro formato: se busca por
  // identidad para no perder el estado operativo ni duplicar al paciente.
  function buscarPrevio(candidato: Omit<FilaDieta, "id">) {
    return (
      porPacienteId.get(candidato.pacienteId) ??
      anterioresComida.find((fila) =>
        mismaIdentidadPacienteDieta(fila, candidato),
      )
    )
  }

  const fusionadas = delApi.map((candidato) => {
    const previo = buscarPrevio(candidato)
    if (previo) {
      return {
        ...previo,
        paciente: candidato.paciente,
        pabellon: candidato.pabellon,
        habitacion: candidato.habitacion,
        servicio: candidato.servicio,
      }
    }
    return {
      ...candidato,
      id: `censo-${candidato.pacienteId}-${comida}`,
      comida,
    }
  })

  const filasComida = deduplicarFilasPorPacienteComida(fusionadas)

  return {
    filas: [...otrasComidas, ...filasComida],
    totalEnCenso: filasComida.length,
  }
}
