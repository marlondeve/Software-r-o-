import { describe, expect, it } from "vitest"

import {
  mapPermisosUiToActualizarRequest,
  permisosUiDesdeRutasApi,
  RUTA_EXPORTAR_REPORTES,
  RUTA_VER_REPORTES_CLINICOS,
  RUTA_VER_REPORTES_PRODUCCION,
} from "@/modules/dietas-cocina/api/mappers/permisos.mapper"

describe("permisos.mapper reportes", () => {
  it("Proveedor con conciliación no infiere reportes clínicos", () => {
    const rutasProveedor = [
      10, 11, 12, 13, 20, 21, 30, 40, 41, 43,
    ]
    const permisos = permisosUiDesdeRutasApi(rutasProveedor)

    expect(permisos["reportes-clinicos"]).toBe(false)
    expect(permisos["reportes-produccion"]).toBe(true)
    expect(permisos.conciliacion).toBe(true)
  })

  it("Guardar sin reportes clínicos elimina la ruta 42", () => {
    const { rutas } = mapPermisosUiToActualizarRequest({
      inicio: true,
      cocina: true,
      conciliacion: true,
      "reportes-clinicos": false,
      "reportes-produccion": true,
    })

    expect(rutas).toContain(RUTA_VER_REPORTES_PRODUCCION)
    expect(rutas).not.toContain(RUTA_VER_REPORTES_CLINICOS)
    expect(rutas).toContain(RUTA_EXPORTAR_REPORTES)
  })

  it("Round-trip conserva toggles de reportes", () => {
    const original = {
      inicio: true,
      "reportes-clinicos": false,
      "reportes-produccion": true,
    }
    const { rutas } = mapPermisosUiToActualizarRequest(original)
    const permisos = permisosUiDesdeRutasApi(rutas)

    expect(permisos["reportes-clinicos"]).toBe(false)
    expect(permisos["reportes-produccion"]).toBe(true)
  })
})
