import { describe, expect, it } from "vitest"

import {
  evaluarAccionesDietaClinica,
  validarCondicionesClinicasFormulario,
} from "@/modules/dietas-cocina/dietas/lib/solicitudDieta"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"

function filaBase(estado: EstadoDieta = "confirmada"): FilaDieta {
  return {
    id: "f1",
    pacienteId: "PAC-1",
    paciente: "Paciente Test",
    edad: 40,
    servicio: "Medicina",
    pabellon: "P1",
    habitacion: "101",
    consistencia: "Sólida",
    tipoDieta: "Normal",
    aislado: false,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado,
    comida: "almuerzo",
  }
}

/** 10:15 — dentro de ventana de almuerzo (10:00–10:30). */
function fechaVentanaAbierta(): Date {
  return new Date(2026, 6, 27, 10, 15, 0)
}

/** 14:00 — fuera de ventana de almuerzo. */
function fechaVentanaCerrada(): Date {
  return new Date(2026, 6, 27, 14, 0, 0)
}

function evaluar(
  estadoVisible: EstadoDieta,
  opts?: {
    rol?: "Enfermera" | "Nutricionista" | "Doctor" | "Administrador"
    fecha?: Date
    comida?: TiempoComida
  },
) {
  return evaluarAccionesDietaClinica({
    fila: filaBase(),
    estadoVisible,
    comida: opts?.comida ?? "almuerzo",
    rol: opts?.rol ?? "Enfermera",
    fecha: opts?.fecha ?? fechaVentanaAbierta(),
  })
}

describe("evaluarAccionesDietaClinica", () => {
  it("oculta novedad y cancelar en recogida", () => {
    const r = evaluar("recogida")
    expect(r.mostrarRegistrarNovedad).toBe(false)
    expect(r.puedeCancelarDieta).toBe(false)
  })

  it("permite novedad en devuelta con ventana abierta", () => {
    const r = evaluar("devuelta")
    expect(r.mostrarRegistrarNovedad).toBe(true)
    expect(r.puedeConfirmarNovedad).toBe(true)
    expect(r.puedeCancelarDieta).toBe(false)
  })

  it("permite novedad y cancelación normal en guardado", () => {
    const r = evaluar("guardado")
    expect(r.mostrarRegistrarNovedad).toBe(true)
    expect(r.puedeConfirmarNovedad).toBe(true)
    expect(r.puedeCancelarDieta).toBe(true)
    expect(r.tipoCancelacion).toBe("normal")
    expect(r.requiereAceptacionCosto).toBe(false)
  })

  it("permite novedad en en-preparacion", () => {
    const r = evaluar("en-preparacion")
    expect(r.mostrarRegistrarNovedad).toBe(true)
    expect(r.puedeConfirmarNovedad).toBe(true)
  })

  it("bloquea novedad desde lista-despacho", () => {
    const r = evaluar("lista-despacho")
    expect(r.mostrarRegistrarNovedad).toBe(false)
  })

  it("muestra novedad pero no confirma fuera de ventana", () => {
    const r = evaluar("confirmada", { fecha: fechaVentanaCerrada() })
    expect(r.mostrarRegistrarNovedad).toBe(true)
    expect(r.puedeConfirmarNovedad).toBe(false)
    expect(r.ventanaAbierta).toBe(false)
  })

  it("enfermera no puede cancelar confirmada", () => {
    const r = evaluar("confirmada", { rol: "Enfermera" })
    expect(r.puedeCancelarDieta).toBe(false)
  })

  it("nutricionista no puede cancelar confirmada", () => {
    const r = evaluar("confirmada", { rol: "Nutricionista" })
    expect(r.puedeCancelarDieta).toBe(false)
    expect(r.motivoBloqueoCancelacion).toContain("Administrador")
  })

  it("administrador puede cancelar confirmada con checkbox", () => {
    const r = evaluar("confirmada", { rol: "Administrador" })
    expect(r.puedeCancelarDieta).toBe(true)
    expect(r.tipoCancelacion).toBe("tardia")
    expect(r.requiereAceptacionCosto).toBe(true)
  })

  it("nutricionista no puede cancelar en-preparacion", () => {
    const r = evaluar("en-preparacion", { rol: "Nutricionista" })
    expect(r.puedeCancelarDieta).toBe(false)
  })

  it("administrador puede cancelar en-preparacion", () => {
    const r = evaluar("en-preparacion", { rol: "Administrador" })
    expect(r.puedeCancelarDieta).toBe(true)
    expect(r.cancelacionEnPreparacion).toBe(true)
  })
})

describe("validarCondicionesClinicasFormulario", () => {
  it("rechaza aislamiento sin observación", () => {
    const r = validarCondicionesClinicasFormulario({
      pacienteAislado: true,
      observacionAislamiento: "",
      alergico: false,
      alergias: "",
    })
    expect(r.valido).toBe(false)
  })

  it("rechaza alergia sin descripción", () => {
    const r = validarCondicionesClinicasFormulario({
      pacienteAislado: false,
      observacionAislamiento: "",
      alergico: true,
      alergias: "   ",
    })
    expect(r.valido).toBe(false)
  })

  it("acepta cuando las condiciones tienen detalle", () => {
    const r = validarCondicionesClinicasFormulario({
      pacienteAislado: true,
      observacionAislamiento: "Contacto por MRSA",
      alergico: true,
      alergias: "Maní",
    })
    expect(r.valido).toBe(true)
  })
})
