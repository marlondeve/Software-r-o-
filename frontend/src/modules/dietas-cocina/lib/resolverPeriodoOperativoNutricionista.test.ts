import { describe, expect, it } from "vitest"

import type { ConfigTiempos } from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import {
  formatearPeriodoOperativo,
  resolverComidaOperativaActual,
  resolverProximoCierre,
} from "@/modules/dietas-cocina/lib/resolverPeriodoOperativoNutricionista"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

function configBase(
  horas: Partial<Record<TiempoComida, Record<string, string>>>,
  activosExtra?: Partial<Record<TiempoComida, boolean>>,
): ConfigTiempos {
  const vacio = {} as Record<TiempoComida, Record<string, string>>
  const activos = {} as Record<TiempoComida, boolean>
  const ids: TiempoComida[] = [
    "desayuno",
    "merienda-manana",
    "almuerzo",
    "merienda-tarde",
    "cena",
    "merienda-noche",
  ]
  for (const id of ids) {
    activos[id] = activosExtra?.[id] ?? true
    vacio[id] = {
      solicitud: "00:00",
      novedades: "00:30",
      llegada: "01:00",
      "inicio-dist": "01:15",
      "fin-dist": "01:30",
      ...(horas[id] ?? {}),
    }
  }
  return { activos, modoCarga: "ventana-por-comida", horasPorComida: vacio }
}

/** Fecha en zona Colombia (UTC-5) con hora local deseada. */
function fechaColombia(hora: number, minuto: number): Date {
  return new Date(Date.UTC(2026, 2, 25, hora + 5, minuto, 0))
}

const horasMeriendaNoche = {
  solicitud: "12:00",
  novedades: "15:00",
  llegada: "16:45",
  "inicio-dist": "17:00",
  "fin-dist": "17:30",
}

describe("resolverPeriodoOperativoNutricionista", () => {
  it("usa fin-dist de parámetros para próximo cierre (no mock 21:15)", () => {
    const config = configBase(
      {
        desayuno: {
          solicitud: "01:00",
          novedades: "05:00",
          llegada: "06:00",
          "inicio-dist": "06:15",
          "fin-dist": "07:00",
        },
        "merienda-noche": horasMeriendaNoche,
      },
      {
        "merienda-manana": false,
        almuerzo: false,
        "merienda-tarde": false,
        cena: false,
      },
    )
    // 16:00 Colombia: aún no llegó fin-dist 17:30
    const cierre = resolverProximoCierre(fechaColombia(16, 0), config)

    expect(cierre.comida).toBe("merienda-noche")
    expect(cierre.hora).toMatch(/05:30\s*p\.\s*m\./i)
    expect(cierre.diaSiguiente).toBe(false)
    expect(cierre.servicio).toBe("MERIENDA DE MEDIA NOCHE")
  })

  it("tras fin-dist de merienda-noche apunta a desayuno del día siguiente", () => {
    const config = configBase(
      {
        desayuno: {
          solicitud: "01:00",
          novedades: "05:00",
          llegada: "06:00",
          "inicio-dist": "06:15",
          "fin-dist": "07:00",
        },
        "merienda-noche": horasMeriendaNoche,
      },
      {
        "merienda-manana": false,
        almuerzo: false,
        "merienda-tarde": false,
        cena: false,
      },
    )
    // 19:47 Colombia — caso del bug (mostraba 09:15 p. m. del mock)
    const cierre = resolverProximoCierre(fechaColombia(19, 47), config)

    expect(cierre.comida).toBe("desayuno")
    expect(cierre.diaSiguiente).toBe(true)
    expect(cierre.servicio).toContain("DÍA SIGUIENTE")
    expect(cierre.hora).not.toMatch(/09:15/i)
  })

  it("periodo operativo toma llegada de la config real", () => {
    const config = configBase(
      { "merienda-noche": horasMeriendaNoche },
      {
        desayuno: false,
        "merienda-manana": false,
        almuerzo: false,
        "merienda-tarde": false,
        cena: false,
      },
    )
    const periodo = formatearPeriodoOperativo(fechaColombia(16, 0), config)
    expect(periodo).toMatch(/Merienda de Media Noche/i)
    expect(periodo).toMatch(/04:45\s*p\.\s*m\./i)
  })

  it("resuelve comida en curso por solicitud–fin-dist", () => {
    const config = configBase(
      { "merienda-noche": horasMeriendaNoche },
      {
        desayuno: false,
        "merienda-manana": false,
        almuerzo: false,
        "merienda-tarde": false,
        cena: false,
      },
    )
    expect(resolverComidaOperativaActual(fechaColombia(16, 30), config)).toBe(
      "merienda-noche",
    )
  })
})
