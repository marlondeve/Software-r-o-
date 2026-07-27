import {
  MOTIVOS_CANCELACION,
  type MotivoCancelacionId,
} from "@/modules/dietas-cocina/types/enums"

export { MOTIVOS_CANCELACION, type MotivoCancelacionId }

export const mockCancelarDieta = {
  avisoCancelacionTardia:
    "Esta cancelación se está realizando fuera del horario de novedades. Según las condiciones contractuales, la clínica asumirá el costo de la dieta aunque no sea consumida.",
  avisoCancelacionEnPreparacion:
    "La dieta ya fue enviada a preparación en cocina. Al cancelarla, la clínica asumirá el costo de la producción iniciada.",
  aceptacionFacturacion:
    "Entiendo y acepto la responsabilidad de facturación por cancelación extemporánea",
  aceptacionFacturacionEnPreparacion:
    "Entiendo y acepto la responsabilidad de facturación por cancelar una dieta en preparación",
  responsable: "Dr. Alberto Martínez (Nutrición)",
  fechaHora: "16/07/2026 - 09:05",
  clinica: "Clínica del Río",
}
