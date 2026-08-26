import { describe, expect, it } from "vitest"

import { fusionarCensoOperativo } from "@/modules/dietas-cocina/lib/fusionarCensoOperativo"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"

function filaBase(id: string, overrides: Partial<FilaDieta> = {}): FilaDieta {
  return {
    id,
    pacienteId: `CC-${id}`,
    paciente: "Paciente Test",
    edad: 40,
    servicio: "Urgencias",
    pabellon: "URGENCIAS HOSPITALIZADO",
    habitacion: "CUB12",
    consistencia: "Normal",
    tipoDieta: "Normal",
    aislado: false,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "confirmada",
    comida: "almuerzo",
    ...overrides,
  }
}

describe("fusionarCensoOperativo", () => {
  it("conserva el estado local aunque el pacienteId tenga otro formato", () => {
    const anteriores = [
      filaBase("legado", {
        pacienteId: "78714472",
        cedula: "78714472",
        estado: "despachada",
      }),
    ]
    const { id: _id, ...delApi } = filaBase("api", {
      pacienteId: "CC-78714472",
      cedula: "78714472",
      estado: "no-solicitada",
      habitacion: "YESO2",
    })

    const { filas, totalEnCenso } = fusionarCensoOperativo(
      anteriores,
      [delApi],
      "almuerzo",
    )

    expect(filas).toHaveLength(1)
    expect(totalEnCenso).toBe(1)
    expect(filas[0].estado).toBe("despachada")
    expect(filas[0].habitacion).toBe("YESO2")
  })

  it("no repite al paciente cuando el censo trae dos veces la misma cédula", () => {
    const candidatos = [
      filaBase("uno", { pacienteId: "CC-78714472", cedula: "78714472" }),
      filaBase("dos", {
        pacienteId: "78714472",
        cedula: "78714472",
        estado: "no-solicitada",
      }),
    ].map(({ id: _id, ...resto }) => resto)

    const { filas, totalEnCenso } = fusionarCensoOperativo(
      [],
      candidatos,
      "almuerzo",
    )

    expect(filas).toHaveLength(1)
    expect(totalEnCenso).toBe(1)
    expect(filas[0].estado).toBe("confirmada")
  })

  it("no toca las filas de otras comidas", () => {
    const anteriores = [
      filaBase("cena", { comida: "cena", estado: "recibida" }),
    ]
    const { id: _id, ...delApi } = filaBase("api", { pacienteId: "CC-999999" })

    const { filas } = fusionarCensoOperativo(anteriores, [delApi], "almuerzo")

    expect(filas).toHaveLength(2)
    expect(filas.find((f) => f.comida === "cena")?.estado).toBe("recibida")
  })
})
