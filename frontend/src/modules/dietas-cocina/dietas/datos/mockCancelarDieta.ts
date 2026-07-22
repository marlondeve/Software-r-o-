export const MOTIVOS_CANCELACION = [
  { id: "alta-medica", label: "Alta médica" },
  { id: "traslado", label: "Traslado" },
  { id: "fallecimiento", label: "Fallecimiento" },
  { id: "npo", label: "NPO / Nada vía oral" },
  { id: "error-solicitud", label: "Error de solicitud" },
  { id: "otro", label: "Otro" },
] as const

export type MotivoCancelacionId = (typeof MOTIVOS_CANCELACION)[number]["id"]

export const mockCancelarDieta = {
  avisoCancelacionTardia:
    "Esta cancelación se está realizando fuera del horario de novedades. Según las condiciones contractuales, la clínica asumirá el costo de la dieta aunque no sea consumida.",
  aceptacionFacturacion:
    "Entiendo y acepto la responsabilidad de facturación por cancelación tardía",
  responsable: "Dr. Alberto Martínez (Nutrición)",
  fechaHora: "16/07/2026 - 09:05 a. m.",
  clinica: "Clínica del Río",
}
