import { describe, expect, it } from "vitest"

import { mapAuditoriaDtoToDomain } from "@/modules/dietas-cocina/api/mappers/auditoria.mapper"
import type { FilaAuditoriaDto } from "@/modules/dietas-cocina/types/api-dtos"

describe("mapAuditoriaDtoToDomain", () => {
  it("interpreta fecha ISO sin zona como UTC y la muestra en hora Colombia", () => {
    const dto: FilaAuditoriaDto = {
      id: "11111111-1111-1111-1111-111111111111",
      fechaHora: "2026-08-26T20:45:00",
      usuario: "Sistema",
      modulo: "dietas",
      accion: "confirmar",
      registroId: "fila-1",
      resultado: "exitoso",
    }
    const fila = mapAuditoriaDtoToDomain(dto)
    expect(fila.fechaHora.toLowerCase()).toContain("03:45 p. m.")
  })
})
