import type { AtencionHospitalaria } from "@/api/types"
import type { FilaDieta } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { getPacientePorDocumento } from "@/api/pacientes.service"
import { getAtencionesHospitalarias } from "@/api/atenciones.service"
import { fusionarCensoOperativo } from "@/modules/dietas-cocina/lib/fusionarCensoOperativo"
import { mapearAtencionHospitalariaAFilaDieta } from "@/modules/dietas-cocina/lib/mapearAtencionHospitalariaAFilaDieta"
import { configDietasOperativas } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

const edadPorDocumento = new Map<string, number>()

async function enriquecerEdadPaciente(
  atencion: AtencionHospitalaria,
): Promise<number | undefined> {
  const clave = `${atencion.tipoDocumento}-${atencion.cedula}`
  if (edadPorDocumento.has(clave)) {
    return edadPorDocumento.get(clave)
  }

  try {
    const paciente = await getPacientePorDocumento(
      atencion.cedula,
      atencion.tipoDocumento,
    )
    if (paciente?.edad != null) {
      edadPorDocumento.set(clave, paciente.edad)
      return paciente.edad
    }
  } catch {
    return undefined
  }

  return undefined
}

export async function cargarFilasCensoDesdeApi(
  comidaReferencia: TiempoComida,
  filasActuales: FilaDieta[] = [],
): Promise<{ filas: FilaDieta[]; totalEnCenso: number }> {
  edadPorDocumento.clear()
  const atenciones = await getAtencionesHospitalarias()
  const edades = await Promise.all(atenciones.map((a) => enriquecerEdadPaciente(a)))

  let acumulado = filasActuales
  let totalEnCenso = 0

  for (const { id: tiempoComida } of configDietasOperativas.comidas) {
    const candidatos = atenciones.map((atencion, index) =>
      mapearAtencionHospitalariaAFilaDieta(atencion, tiempoComida, {
        edad: edades[index],
      }),
    )
    const { filas, totalEnCenso: total } = fusionarCensoOperativo(
      acumulado,
      candidatos,
      tiempoComida,
    )
    acumulado = filas
    if (tiempoComida === comidaReferencia) {
      totalEnCenso = total
    }
  }

  return { filas: acumulado, totalEnCenso }
}
