import type {
  DietaCatalogo,
  TarifaHistorico,
} from "@/modules/dietas-cocina/types/catalog"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"

function historicoBase(
  anio: number,
  monto: number,
  vigente: boolean,
  registradoPor: string,
  motivo: string,
): TarifaHistorico[] {
  return COMIDAS_TABS.map((comida, index) => ({
    id: `TRF-${anio}-${String(index + 1).padStart(2, "0")}`,
    anio,
    tiempoComida: comida.id,
    monto: monto + index * 500,
    vigenciaDesde: "01 Ene",
    vigenciaHasta: "31 Dic",
    registradoPor,
    motivoCambio: motivo,
    creadoEn: `15 Dic ${anio - 1}`,
    vigente,
  }))
}

function tarifasVigentesDesdeHistorico(
  historico: TarifaHistorico[],
): Partial<Record<TiempoComida, number>> {
  return Object.fromEntries(
    historico.filter((item) => item.vigente).map((item) => [item.tiempoComida, item.monto]),
  )
}

function crearDieta(
  index: number,
  overrides: Partial<DietaCatalogo> &
    Pick<DietaCatalogo, "nombre" | "descripcion">,
): DietaCatalogo {
  const n = String(index).padStart(3, "0")
  const tarifaBase = overrides.tarifaVigente ?? 45_000 + index * 2_500
  const historicoTarifas =
    overrides.historicoTarifas ??
    [
      ...historicoBase(
        2024,
        tarifaBase,
        true,
        "Dra. M. Salinas",
        "Ajuste por inflación anual e inclusión de nuevos suplementos nutricionales base.",
      ),
      ...historicoBase(
        2023,
        tarifaBase - 5_000,
        false,
        "Admin Sist.",
        "Actualización estándar de tabulador.",
      ),
      ...historicoBase(
        2022,
        tarifaBase - 10_000,
        false,
        "J. Director",
        "Creación inicial de la tarifa en el nuevo sistema Bital.",
      ),
    ]
  const tarifasVigentes =
    overrides.tarifasVigentes ?? tarifasVigentesDesdeHistorico(historicoTarifas)

  const montosVigentes = Object.values(tarifasVigentes).filter((monto) => monto > 0)

  return {
    id: `diet-cat-${index}`,
    codigo: `D-${n}`,
    estado: "vigente",
    fechaInicio: "01 Ene 2024",
    fechaFin: "31 Dic 2024",
    ultimaActualizacion: "15 Mar 2024, 08:30",
    usuario: index % 2 === 0 ? "admin_sistema" : "m.nutricion",
    activa: true,
    ...overrides,
    historicoTarifas,
    tarifasVigentes,
    tarifaVigente:
      montosVigentes.length > 0 ? Math.min(...montosVigentes) : tarifaBase,
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
    descripcion: "Baja en sodio.",
    tarifaVigente: 48_000,
  },
  {
    nombre: "Blanda Hospitalaria",
    descripcion: "Textura blanda para pacientes con dificultad de masticación.",
    tarifaVigente: 46_000,
  },
  {
    nombre: "Proteica",
    descripcion: "Alto aporte proteico.",
    tarifaVigente: 58_000,
  },
  {
    nombre: "Líquida clara",
    descripcion: "Líquidos transparentes.",
    tarifaVigente: 38_000,
  },
  {
    nombre: "Líquida completa",
    descripcion: "Líquidos opacos permitidos.",
    tarifaVigente: 42_000,
  },
  {
    nombre: "Hipocalórica",
    descripcion: "Restricción calórica.",
    tarifaVigente: 47_000,
  },
  {
    nombre: "Blanda / Sin sal",
    descripcion: "Blanda con restricción de sodio.",
    tarifaVigente: 49_500,
  },
]

const DIETAS_EXTRA: Array<
  Pick<DietaCatalogo, "nombre" | "descripcion"> & Partial<DietaCatalogo>
> = [
  {
    nombre: "Renal",
    descripcion: "Restricción de potasio y fósforo.",
    tarifaVigente: 55_000,
  },
  {
    nombre: "Celíaca",
    descripcion: "Sin gluten.",
    tarifaVigente: 53_000,
  },
  {
    nombre: "Pediatrica",
    descripcion: "Porciones adaptadas a pediatría.",
    tarifaVigente: 41_000,
  },
]

import { TAMANO_PAGINA_TABLA } from "@/lib/tamanoPaginaTabla"

export const TAMANO_PAGINA_CATALOGO = TAMANO_PAGINA_TABLA

export function crearDietasCatalogoIniciales(): DietaCatalogo[] {
  const todas = [...DIETAS_BASE, ...DIETAS_EXTRA]
  return todas.map((item, idx) =>
    crearDieta(idx + 1, {
      ...item,
      tarifaVigente: item.tarifaVigente ?? 40_000 + idx * 1_000,
    }),
  )
}
