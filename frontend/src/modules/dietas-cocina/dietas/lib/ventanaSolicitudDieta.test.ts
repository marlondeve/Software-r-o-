import { describe, expect, it } from "vitest"

import type { ConfigTiempos } from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { resolverEstadoVentanaComida } from "@/modules/dietas-cocina/dietas/lib/ventanaSolicitudDieta"

function configAlmuerzo(
  solicitud = "07:00",
  novedades = "09:30",
  modoCarga: ConfigTiempos["modoCarga"] = "ventana-por-comida",
): ConfigTiempos {
  return {
    activos: {
      desayuno: true,
      "merienda-manana": true,
      almuerzo: true,
      "merienda-tarde": true,
      cena: true,
      "merienda-noche": true,
    },
    modoCarga,
    horasPorComida: {
      desayuno: {},
      "merienda-manana": {},
      almuerzo: {
        solicitud,
        novedades,
        llegada: "11:30",
        "inicio-dist": "12:00",
        "fin-dist": "13:30",
      },
      "merienda-tarde": {},
      cena: {},
      "merienda-noche": {},
    },
  }
}

describe("resolverEstadoVentanaComida", () => {
  it("muestra cuenta regresiva cuando la ventana aún no abrió hoy", () => {
    const estado = resolverEstadoVentanaComida(
      "almuerzo",
      new Date(2026, 7, 23, 6, 30, 0),
      configAlmuerzo(),
    )

    expect(estado.ventanaAbierta).toBe(false)
    expect(estado.mensajeCierre).toBe("Abre en: 30 min")
  })

  it("muestra cierre cuando la ventana está abierta", () => {
    const estado = resolverEstadoVentanaComida(
      "almuerzo",
      new Date(2026, 7, 23, 8, 0, 0),
      configAlmuerzo(),
    )

    expect(estado.ventanaAbierta).toBe(true)
    expect(estado.mensajeCierre).toBe("Cierre en: 1h 30 min")
  })

  it("no cuenta hasta mañana cuando la ventana ya cerró hoy", () => {
    const estado = resolverEstadoVentanaComida(
      "almuerzo",
      new Date(2026, 7, 23, 9, 53, 0),
      configAlmuerzo(),
    )

    expect(estado.ventanaAbierta).toBe(false)
    expect(estado.mensajeCierre).toBe("Ventana cerrada (cerró a las 09:30 a. m.)")
    expect(estado.mensajeCierre).not.toContain("21h")
  })

  it("muestra abre en para ventana nocturna en el hueco del día", () => {
    const config = configAlmuerzo("19:00", "09:30")
    const estado = resolverEstadoVentanaComida(
      "almuerzo",
      new Date(2026, 7, 23, 12, 0, 0),
      config,
    )

    expect(estado.ventanaAbierta).toBe(false)
    expect(estado.mensajeCierre).toBe("Abre en: 7h")
  })
})
