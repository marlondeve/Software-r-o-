export interface EventoTrazabilidad {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  activo?: boolean
}

export const MOTIVOS_NOVEDAD = [
  "Cambio clínico",
  "Ajuste de consistencia",
  "Modificación por alergia",
  "Corrección de solicitud",
  "Otro",
]

const trazabilidadBase: EventoTrazabilidad[] = [
  {
    id: "ev-1",
    titulo: "Solicitud confirmada",
    descripcion: "Dieta visible para producción en cocina.",
    fecha: "Hoy, 07:45 AM",
    activo: true,
  },
  {
    id: "ev-2",
    titulo: "Solicitud guardada",
    descripcion: "Borrador registrado por enfermería.",
    fecha: "Hoy, 07:30 AM",
  },
  {
    id: "ev-3",
    titulo: "Paciente ingresado",
    descripcion: "Censo actualizado en el servicio.",
    fecha: "Ayer, 04:15 PM",
  },
]

const descripcionesPorTipo: Record<string, string> = {
  General: "Dieta estándar hospitalaria sin modificaciones especiales.",
  Blanda: "Alimentos de fácil masticación y digestión.",
  "Blanda / Sin sal": "Dieta blanda con restricción de sodio.",
  Hipocalórica: "Control calórico para manejo de peso.",
  "Líquida clara": "Solo líquidos transparentes. Ayuno parcial.",
  "Líquida completa": "Líquidos completos tolerados por vía oral.",
}

export function obtenerTrazabilidad(filaId: string): EventoTrazabilidad[] {
  return trazabilidadBase.map((evento, index) => ({
    ...evento,
    id: `${filaId}-${evento.id}`,
    activo: index === 0,
  }))
}

export function obtenerDescripcionDieta(tipoDieta: string | null): string {
  if (!tipoDieta) return "Sin descripción disponible."
  return descripcionesPorTipo[tipoDieta] ?? "Dieta configurada según indicación clínica."
}
