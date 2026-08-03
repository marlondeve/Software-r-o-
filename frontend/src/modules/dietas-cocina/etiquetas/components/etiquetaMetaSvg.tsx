import { TIPOGRAFIA_IMPRESION } from "@/modules/dietas-cocina/etiquetas/lib/etiquetaImpresionLayout"
import { pxCapturaImpresion } from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"

const C = {
  black85: "#1a1a1a",
  black50: "#808080",
  black25: "#bfbfbf",
} as const

const LINEA_ALTO = pxCapturaImpresion(11)
const ICONO_OFFSET_X = pxCapturaImpresion(10)
const TEXTO_Y = pxCapturaImpresion(9)
const META_FONT_SIZE = TIPOGRAFIA_IMPRESION.meta
const META_FONT_WEIGHT = 700

export type IconoMetaTipo =
  | "idCard"
  | "calendar"
  | "mapPin"
  | "user"
  | "shield"
  | "message"

function TrazosIcono({ tipo }: { tipo: IconoMetaTipo }) {
  switch (tipo) {
    case "idCard":
      return (
        <>
          <rect width={18} height={13} x={3} y={5} rx={2} />
          <path d="M7 10h4" />
          <path d="M7 14h6" />
        </>
      )
    case "calendar":
      return (
        <>
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width={18} height={18} x={3} y={4} rx={2} />
          <path d="M3 10h18" />
        </>
      )
    case "mapPin":
      return (
        <>
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx={12} cy={10} r={3} />
        </>
      )
    case "user":
      return (
        <>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx={12} cy={7} r={4} />
        </>
      )
    case "shield":
      return (
        <>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </>
      )
    case "message":
      return <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  }
}

/** Icono + texto en SVG — alineación fiable con html2canvas. */
export function ChipIconoTexto({
  tipo,
  texto,
  fontSize = 9.5,
  fontWeight = 400,
  color = C.black85,
  stroke = C.black50,
}: {
  tipo: IconoMetaTipo
  texto: string
  fontSize?: number
  fontWeight?: number | string
  color?: string
  stroke?: string
}) {
  const anchoTexto = Math.ceil(texto.length * fontSize * 0.52)
  const ancho = ICONO_OFFSET_X + anchoTexto + 2

  return (
    <svg
      width={ancho}
      height={LINEA_ALTO}
      style={{ display: "block", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="translate(0, 2) scale(0.42)"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <TrazosIcono tipo={tipo} />
      </g>
      <text
        x={ICONO_OFFSET_X}
        y={TEXTO_Y}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={color}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {texto}
      </text>
    </svg>
  )
}

export function FilaMetaSvg({
  chips,
}: {
  chips: { tipo: IconoMetaTipo; texto: string }[]
}) {
  const segmentos: { tipo?: IconoMetaTipo; texto: string; esSep?: boolean }[] = []
  chips.forEach((chip, i) => {
    if (i > 0) segmentos.push({ texto: "|", esSep: true })
    segmentos.push(chip)
  })

  const anchos = segmentos.map((seg) => {
    if (seg.esSep) return 12
    return ICONO_OFFSET_X + Math.ceil(seg.texto.length * META_FONT_SIZE * 0.52) + 2
  })
  const anchoTotal = anchos.reduce((a, b) => a + b, 0)

  let x = 0
  return (
    <svg
      width={anchoTotal}
      height={LINEA_ALTO}
      style={{ display: "block", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {segmentos.map((seg, i) => {
        const segX = x
        x += anchos[i]
        if (seg.esSep) {
          return (
            <text
              key={i}
              x={segX + 6}
              y={TEXTO_Y}
              textAnchor="middle"
              fontSize={META_FONT_SIZE}
              fill={C.black25}
              fontFamily="Arial, Helvetica, sans-serif"
            >
              |
            </text>
          )
        }
        return (
          <g key={i} transform={`translate(${segX}, 0)`}>
            <g
              transform="translate(0, 1) scale(0.42)"
              fill="none"
              stroke={C.black50}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <TrazosIcono tipo={seg.tipo!} />
            </g>
            <text
              x={ICONO_OFFSET_X}
              y={TEXTO_Y}
              fontSize={META_FONT_SIZE}
              fontWeight={META_FONT_WEIGHT}
              fill={C.black85}
              fontFamily="Arial, Helvetica, sans-serif"
            >
              {seg.texto}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
