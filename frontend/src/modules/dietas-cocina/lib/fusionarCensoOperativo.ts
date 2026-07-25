import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

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

  const fusionadas = delApi.map((candidato) => {
    const previo = porPacienteId.get(candidato.pacienteId)
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

  return {
    filas: [...otrasComidas, ...fusionadas],
    totalEnCenso: fusionadas.length,
  }
}
