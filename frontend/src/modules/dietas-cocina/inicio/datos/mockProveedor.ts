import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"

export const mockProveedor = {
  turno: "Cena (18:00 - 20:00)",
  kpis: [
    {
      label: "Total a preparar",
      value: "150",
      subtitle: "raciones",
      progress: 0,
      accentBorder: true,
    },
    {
      label: "Listas para despacho",
      value: "40",
      subtitle: "esperando transporte",
      progress: 27,
      progressColor: "secondary" as const,
    },
    {
      label: "Despachadas",
      value: "110",
      subtitle: "en tránsito",
      progress: 73,
      progressColor: "muted" as const,
    },
    {
      label: "Recibidas en clínica",
      value: "95",
      subtitle: "confirmadas",
      progress: 63,
      progressColor: "primary" as const,
    },
  ],
  ordenes: [
    {
      id: "ORD-2890",
      destino: "Piso 3 - Cardiología",
      tipo: "Baja en Sodio (x12)",
      estado: "en-preparacion" as EstadoDieta,
      accion: "qr" as const,
    },
    {
      id: "ORD-2891",
      destino: "UCI - Módulo B",
      tipo: "Líquida Estricta (x4)",
      estado: "lista-despacho" as EstadoDieta,
      accion: "despacho" as const,
    },
    {
      id: "ORD-2892",
      destino: "Piso 1 - Maternidad",
      tipo: "General (x22)",
      estado: "por-iniciar" as EstadoDieta,
      accion: "qr" as const,
    },
  ],
  alertas: [
    {
      title: "Entregas pendientes",
      description:
        "15 despachos superan el tiempo estimado de tránsito.",
    },
    {
      title: "Recolección de vajilla",
      description: "Pendiente en Piso 2 desde hace 45 minutos.",
    },
  ],
  etiquetas: {
    impresas: { current: 110, total: 150 },
    escaneadas: { current: 90, total: 110 },
  },
}
