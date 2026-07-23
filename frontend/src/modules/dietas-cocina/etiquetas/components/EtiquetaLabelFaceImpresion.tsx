import logoClinica from "@/assets/Logo-Clinica-del-Rio.png"
import {
  etiquetaComidaLabel,
  type EtiquetaDieta,
} from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  CAPTURA_PADDING_PX,
  ETIQUETA_ALTO_PX,
  ETIQUETA_ANCHO_PX,
  ETIQUETA_QR_COL_RATIO,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"

interface EtiquetaLabelFaceImpresionProps {
  etiqueta: EtiquetaDieta
  qrSrc: string
}

const QR_COL = `${ETIQUETA_QR_COL_RATIO * 100}%`

const C = {
  black: "#000000",
  black85: "#1a1a1a",
  black65: "#595959",
  black55: "#737373",
  black50: "#808080",
  black25: "#bfbfbf",
  black15: "#d9d9d9",
  white: "#ffffff",
} as const

const LINEA_ALTO = 14
const ICONO_OFFSET_X = 12
const TEXTO_Y = 10.5

type IconoTipo =
  | "idCard"
  | "calendar"
  | "mapPin"
  | "user"
  | "shield"
  | "utensils"
  | "message"

function TrazosIcono({ tipo }: { tipo: IconoTipo }) {
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
    case "utensils":
      return (
        <>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </>
      )
    case "message":
      return <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  }
}

/** Icono + texto en un solo SVG — alineación fiable con html2canvas. */
function ChipIconoTexto({
  tipo,
  texto,
  fontSize = 9.5,
  fontWeight = 400,
  color = C.black85,
  stroke = C.black50,
}: {
  tipo: IconoTipo
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

function FilaMetaSvg({
  chips,
}: {
  chips: { tipo: IconoTipo; texto: string }[]
}) {
  const segmentos: { tipo?: IconoTipo; texto: string; esSep?: boolean }[] = []
  chips.forEach((chip, i) => {
    if (i > 0) segmentos.push({ texto: "|", esSep: true })
    segmentos.push(chip)
  })

  const anchos = segmentos.map((seg) => {
    if (seg.esSep) return 14
    const fs = 9.5
    return ICONO_OFFSET_X + Math.ceil(seg.texto.length * fs * 0.52) + 2
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
              x={segX + 7}
              y={TEXTO_Y}
              textAnchor="middle"
              fontSize={9.5}
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
              transform="translate(0, 2) scale(0.42)"
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
              fontSize={9.5}
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

function BadgeEscanear() {
  return (
    <svg
      width={78}
      height={22}
      viewBox="0 0 78 22"
      role="img"
      aria-label="Escanear"
      style={{ display: "block" }}
    >
      <rect x={0} y={0} width={78} height={22} rx={6} fill={C.black} />
      <text
        x={39}
        y={15}
        textAnchor="middle"
        fill={C.white}
        fontSize={9}
        fontWeight={700}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.6"
      >
        ESCANEAR
      </text>
    </svg>
  )
}

/** Solo para captura PDF — no se usa en pantalla. */
export function EtiquetaLabelFaceImpresion({
  etiqueta,
  qrSrc,
}: EtiquetaLabelFaceImpresionProps) {
  const comida = etiquetaComidaLabel(etiqueta.comida)
  const ubicacion = `${etiqueta.pabellon} - Hab ${etiqueta.habitacion}`
  const qrSize = 104

  return (
    <div
      data-etiqueta-capture
      style={{
        boxSizing: "content-box",
        padding: CAPTURA_PADDING_PX,
        background: C.white,
        display: "inline-block",
      }}
    >
      <div
        data-etiqueta-print
        style={{
          boxSizing: "border-box",
          width: ETIQUETA_ANCHO_PX,
          height: ETIQUETA_ALTO_PX,
          border: `2px solid ${C.black}`,
          borderRadius: 8,
          background: C.white,
          color: C.black,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: 6,
            display: "grid",
            gridTemplateColumns: `minmax(0, 1fr) ${QR_COL}`,
          }}
        >
          <div
            style={{
              minWidth: 0,
              boxSizing: "border-box",
              padding: "11px 13px 9px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
                borderBottom: `1px solid ${C.black15}`,
                paddingBottom: 5,
                flexShrink: 0,
              }}
            >
              <img
                src={logoClinica}
                alt="Clínica del Río"
                style={{
                  display: "block",
                  height: 32,
                  width: "auto",
                  maxWidth: 120,
                  objectFit: "contain",
                  objectPosition: "left center",
                }}
              />
              <div style={{ flexShrink: 0, textAlign: "right", lineHeight: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {comida}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: C.black65 }}>
                  {etiqueta.fechaHora}
                </p>
              </div>
            </div>

            <h3
              style={{
                marginTop: 2,
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                lineHeight: 1.3,
                flexShrink: 0,
              }}
            >
              {etiqueta.paciente}
            </h3>

            <div
              style={{
                paddingBottom: 7,
                color: C.black85,
                flexShrink: 0,
              }}
            >
              <div style={{ marginBottom: 5 }}>
                <FilaMetaSvg
                  chips={[
                    { tipo: "idCard", texto: `ID: ${etiqueta.pacienteId}` },
                    { tipo: "calendar", texto: `Edad: ${etiqueta.edad}` },
                    { tipo: "mapPin", texto: ubicacion },
                  ]}
                />
              </div>
              <FilaMetaSvg
                chips={[
                  { tipo: "user", texto: `CC: ${etiqueta.documento}` },
                  {
                    tipo: "shield",
                    texto: `Aislamiento: ${etiqueta.aislamiento ? "Sí" : "No"}`,
                  },
                ]}
              />
            </div>

            <div
              style={{
                border: `1px solid ${C.black}`,
                borderRadius: 2,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    padding: "8px 10px",
                    borderRight: `1px solid ${C.black}`,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 9,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      color: C.black55,
                      lineHeight: 1,
                    }}
                  >
                    Dieta:
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      lineHeight: 1.25,
                    }}
                  >
                    {etiqueta.tipoDieta}
                  </p>
                </div>
                <div style={{ minWidth: 0, padding: "8px 10px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 9,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      color: C.black55,
                      lineHeight: 1,
                    }}
                  >
                    Consistencia:
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.25,
                    }}
                  >
                    {etiqueta.consistencia}
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                border: `1px solid ${C.black}`,
                borderRadius: 2,
                padding: "8px 10px",
                flexShrink: 0,
              }}
            >
              <ChipIconoTexto
                tipo="message"
                texto="Observaciones"
                fontSize={9}
                fontWeight={700}
                color={C.black}
                stroke={C.black}
              />
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 10,
                  lineHeight: 1.375,
                  color: C.black85,
                }}
              >
                {etiqueta.observaciones || "—"}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: `1px solid ${C.black}`,
              height: "100%",
              boxSizing: "border-box",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 10,
                paddingBottom: 4,
                flexShrink: 0,
              }}
            >
              <BadgeEscanear />
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 6px",
                minHeight: 0,
              }}
            >
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt=""
                  width={qrSize}
                  height={qrSize}
                  style={{
                    display: "block",
                    width: qrSize,
                    height: qrSize,
                    objectFit: "contain",
                  }}
                />
              ) : null}
            </div>

            <p
              style={{
                margin: 0,
                padding: "0 8px 8px",
                textAlign: "center",
                fontSize: 9,
                color: C.black50,
                flexShrink: 0,
              }}
            >
              {etiqueta.codigo}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
