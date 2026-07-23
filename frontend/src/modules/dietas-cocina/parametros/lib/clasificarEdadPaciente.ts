import type { CategoriaEdad } from "@/modules/dietas-cocina/parametros/datos/mockTiposPaciente"

export interface ResultadoClasificacion {
  edadCalculada: string
  categoria: string
  regla: string
}

interface EdadDescompuesta {
  dias: number
  meses: number
  anos: number
}

function descomponerEdad(nacimiento: Date, referencia: Date): EdadDescompuesta {
  let anos = referencia.getFullYear() - nacimiento.getFullYear()
  let meses = referencia.getMonth() - nacimiento.getMonth()
  let dias = referencia.getDate() - nacimiento.getDate()

  if (dias < 0) {
    meses -= 1
    const ultimoDiaMes = new Date(
      referencia.getFullYear(),
      referencia.getMonth(),
      0,
    ).getDate()
    dias += ultimoDiaMes
  }

  if (meses < 0) {
    anos -= 1
    meses += 12
  }

  const msTotal = referencia.getTime() - nacimiento.getTime()
  const diasTotal = Math.max(0, Math.floor(msTotal / (1000 * 60 * 60 * 24)))

  return { dias: diasTotal, meses: anos * 12 + meses, anos }
}

function formatearEdad(edad: EdadDescompuesta): string {
  if (edad.dias <= 28) {
    return `${edad.dias} ${edad.dias === 1 ? "Día" : "Días"}`
  }

  if (edad.anos === 0) {
    const mesesRestantes = edad.meses
    return `${mesesRestantes} ${mesesRestantes === 1 ? "Mes" : "Meses"}`
  }

  const partes: string[] = [
    `${edad.anos} ${edad.anos === 1 ? "Año" : "Años"}`,
  ]
  const mesesRestantes = edad.meses % 12
  if (mesesRestantes > 0) {
    partes.push(
      `${mesesRestantes} ${mesesRestantes === 1 ? "Mes" : "Meses"}`,
    )
  }
  return partes.join(", ")
}

function valorEnUnidad(
  edad: EdadDescompuesta,
  unidad: CategoriaEdad["unidad"],
): number {
  switch (unidad) {
    case "Días":
      return edad.dias
    case "Meses":
      return edad.meses
    case "Años":
      return edad.anos
  }
}

const PRIORIDAD_UNIDAD: Record<CategoriaEdad["unidad"], number> = {
  Días: 0,
  Meses: 1,
  Años: 2,
}

export function clasificarEdadPaciente(
  fechaNacimiento: string,
  fechaReferencia: string,
  categorias: CategoriaEdad[],
): ResultadoClasificacion | null {
  const nacimiento = new Date(fechaNacimiento)
  const referencia = new Date(fechaReferencia)

  if (
    Number.isNaN(nacimiento.getTime()) ||
    Number.isNaN(referencia.getTime()) ||
    referencia < nacimiento
  ) {
    return null
  }

  const edad = descomponerEdad(nacimiento, referencia)
  const activas = categorias.filter((c) => c.estado === "activo")

  const coincidencias = activas
    .map((categoria) => {
      const valor = valorEnUnidad(edad, categoria.unidad)
      const coincide =
        valor >= categoria.rangoMin && valor <= categoria.rangoMax
      return { categoria, coincide, valor }
    })
    .filter((item) => item.coincide)
    .sort(
      (a, b) =>
        PRIORIDAD_UNIDAD[a.categoria.unidad] -
        PRIORIDAD_UNIDAD[b.categoria.unidad],
    )

  const seleccionada = coincidencias[0]?.categoria

  if (!seleccionada) {
    return {
      edadCalculada: formatearEdad(edad),
      categoria: "Sin categoría",
      regla: "Ninguna regla activa coincide con la edad calculada",
    }
  }

  return {
    edadCalculada: formatearEdad(edad),
    categoria: seleccionada.nombre,
    regla: `${seleccionada.rangoMin} - ${seleccionada.rangoMax} ${seleccionada.unidad}`,
  }
}
