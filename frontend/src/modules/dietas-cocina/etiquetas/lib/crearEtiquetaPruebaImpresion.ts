import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"

/** Código fijo para pruebas de calibración de impresora. */
export const CODIGO_ETIQUETA_PRUEBA_IMPRESION = "LBL-PRUEBA-IMP-2026"

/**
 * Misma estructura `EtiquetaDieta` que el flujo real de impresión
 * (`EtiquetaLabelFace` + `generarPdfEtiquetas` / html2canvas + jsPDF).
 */
export function crearEtiquetaPruebaImpresion(
  overrides: Partial<EtiquetaDieta> = {},
): EtiquetaDieta {
  const codigo = overrides.codigo ?? CODIGO_ETIQUETA_PRUEBA_IMPRESION
  return {
    id: "etq-prueba-imp",
    estado: "generada",
    pacienteId: "22519010",
    paciente: "MACIAS FERNANDEZ, LISSETH",
    documento: "22519010",
    edad: 46,
    aislamiento: false,
    pabellon: "HOSPITALIZACION PISO 3",
    habitacion: "3HP09",
    tipoDieta: "HIPOSÓDICA",
    consistencia: "Blanda",
    observaciones:
      "Sin tomate, intolerancia leve a lácteos. Alergias: mariscos y maní.",
    comida: "almuerzo",
    fechaHora: "24/08/2026 12:30",
    ...overrides,
    codigo,
    qrPayload: overrides.qrPayload ?? payloadQrEtiqueta(codigo),
  }
}
