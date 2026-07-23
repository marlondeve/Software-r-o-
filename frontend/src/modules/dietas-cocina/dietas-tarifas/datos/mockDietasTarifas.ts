export type EstadoDietaCatalogo = "vigente" | "programada" | "vencida"

export interface TarifaHistorico {
  id: string
  anio: number
  monto: number
  vigenciaDesde: string
  vigenciaHasta: string
  registradoPor: string
  motivoCambio: string
  creadoEn: string
  vigente: boolean
}

export interface DietaCatalogo {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  estado: EstadoDietaCatalogo
  tarifaVigente: number
  fechaInicio: string
  fechaFin: string | null
  ultimaActualizacion: string
  usuario: string
  activa: boolean
  historicoTarifas: TarifaHistorico[]
}

function historicoBase(
  anio: number,
  monto: number,
  vigente: boolean,
  registradoPor: string,
  motivo: string,
): TarifaHistorico {
  return {
    id: `TRF-${anio}-01`,
    anio,
    monto,
    vigenciaDesde: "01 Ene",
    vigenciaHasta: "31 Dic",
    registradoPor,
    motivoCambio: motivo,
    creadoEn: `15 Dic ${anio - 1}`,
    vigente,
  }
}

function crearDieta(
  index: number,
  overrides: Partial<DietaCatalogo> &
    Pick<DietaCatalogo, "nombre" | "descripcion">,
): DietaCatalogo {
  const n = String(index).padStart(3, "0")
  const tarifa = overrides.tarifaVigente ?? 45_000 + index * 2_500
  return {
    id: `diet-cat-${index}`,
    codigo: `D-${n}`,
    estado: "vigente",
    tarifaVigente: tarifa,
    fechaInicio: "01 Ene 2024",
    fechaFin: "31 Dic 2024",
    ultimaActualizacion: "15 Mar 2024, 08:30",
    usuario: index % 2 === 0 ? "admin_sistema" : "m.nutricion",
    activa: true,
    historicoTarifas: [
      historicoBase(
        2024,
        tarifa,
        true,
        "Dra. M. Salinas",
        "Ajuste por inflación anual e inclusión de nuevos suplementos nutricionales base.",
      ),
      historicoBase(
        2023,
        tarifa - 5_000,
        false,
        "Admin Sist.",
        "Actualización estándar de tabulador.",
      ),
      historicoBase(
        2022,
        tarifa - 10_000,
        false,
        "J. Director",
        "Creación inicial de la tarifa en el nuevo sistema Bital.",
      ),
    ],
    ...overrides,
  }
}

const DIETAS_BASE: Array<
  Pick<DietaCatalogo, "nombre" | "descripcion"> & Partial<DietaCatalogo>
> = [
  {
    nombre: "Normal",
    descripcion: "Dieta basal sin restricciones.",
    tarifaVigente: 45_000,
  },
  {
    nombre: "Diabética",
    descripcion: "Control de carbohidratos y azúcares.",
    tarifaVigente: 52_500,
  },
  {
    nombre: "Hiposódica",
    descripcion: "Restricción de sodio para pacientes cardiovasculares.",
    tarifaVigente: 48_000,
  },
  {
    nombre: "Blanda Hospitalaria",
    descripcion: "Textura blanda, fácil masticación y digestión.",
    tarifaVigente: 1_450_000,
  },
  {
    nombre: "Proteica",
    descripcion: "Alto aporte proteico para recuperación.",
    tarifaVigente: 58_000,
  },
  {
    nombre: "Líquida clara",
    descripcion: "Líquidos transparentes, sin residuo.",
    tarifaVigente: 38_000,
  },
  {
    nombre: "Líquida completa",
    descripcion: "Líquidos con lacteos y sopas coladas.",
    tarifaVigente: 42_000,
  },
  {
    nombre: "Hipocalórica",
    descripcion: "Reducción calórica controlada.",
    tarifaVigente: 47_000,
  },
  {
    nombre: "Blanda / Sin sal",
    descripcion: "Blanda con restricción estricta de sodio.",
    tarifaVigente: 49_500,
    estado: "programada",
    fechaInicio: "01 Ene 2025",
    fechaFin: "31 Dic 2025",
  },
  {
    nombre: "Renal",
    descripcion: "Restricción de potasio, fósforo y proteínas.",
    tarifaVigente: 55_000,
  },
  {
    nombre: "Celíaca",
    descripcion: "Libre de gluten certificado.",
    tarifaVigente: 53_000,
  },
  {
    nombre: "Pediatrica",
    descripcion: "Porciones y consistencias adaptadas a menores.",
    tarifaVigente: 41_000,
  },
]

export function crearDietasCatalogoIniciales(): DietaCatalogo[] {
  const dietas = DIETAS_BASE.map((d, i) => crearDieta(i + 1, d))

  const extras: DietaCatalogo[] = Array.from({ length: 12 }, (_, i) => {
    const idx = i + 13
    return crearDieta(idx, {
      nombre: `Dieta especial ${idx - 12}`,
      descripcion: `Variante clínica ${idx - 12} para casos específicos.`,
      tarifaVigente: 40_000 + idx * 1_000,
      estado: i % 5 === 0 ? "vencida" : "vigente",
      activa: i % 5 !== 0,
      fechaFin: i % 5 === 0 ? "31 Dic 2023" : "31 Dic 2024",
    })
  })

  return [...dietas, ...extras]
}

export const TAMANO_PAGINA_CATALOGO = 10
