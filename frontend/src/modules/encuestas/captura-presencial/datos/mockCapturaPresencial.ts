export type EstadoPaciente = "pendiente" | "en_proceso" | "completada" | "no_disponible"

export interface PacientePresencial {
  id: string
  nombre: string
  documento: string
  servicio: string
  ubicacion: string
  aseguradora?: string
  estado: EstadoPaciente
  guardadoHace?: string
  motivoNoDisponible?: string
  horaReporte?: string
}

export const SERVICIOS_PRESENCIAL = [
  "Hospitalización",
  "Urgencias",
  "UCI",
  "Consulta Externa",
]

export const PABELLONES = ["Pabellón A", "Pabellón B", "Pabellón C"]

export const mockCapturaPresencial = {
  kpis: {
    pacientesActivos: 124,
    encuestasCompletadas: 45,
    pendientes: 62,
    noDisponibles: 12,
    rechazadas: 5,
    coberturaTurno: 36,
  },
  pacientes: [
    {
      id: "1",
      nombre: "García Pérez, María C.",
      documento: "1029384756",
      servicio: "Hospitalización",
      ubicacion: "Hab: 304-B",
      aseguradora: "Sura EPS",
      estado: "pendiente",
    },
    {
      id: "2",
      nombre: "Rodríguez Gómez, Juan P.",
      documento: "987654321",
      servicio: "Urgencias",
      ubicacion: "Box 5",
      aseguradora: "Sanitas",
      estado: "en_proceso",
      guardadoHace: "2m",
    },
    {
      id: "3",
      nombre: "Martínez, Ana Paula",
      documento: "1122334455",
      servicio: "UCI",
      ubicacion: "Cama 12",
      estado: "completada",
    },
    {
      id: "4",
      nombre: "Ospina, Carlos Mario",
      documento: "5544332211",
      servicio: "Hospitalización",
      ubicacion: "Hab: 410-A",
      estado: "no_disponible",
      motivoNoDisponible: "Paciente en procedimiento quirúrgico.",
      horaReporte: "10:30 AM",
    },
  ] satisfies PacientePresencial[],
}
