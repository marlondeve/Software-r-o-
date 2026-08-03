import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"
import type { CSSProperties, ReactNode, SVGProps } from "react"

import { formatearFechaHoraEnCadena } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import logoClinica from "@/assets/Logo-Clinica-del-Rio.png"
import { etiquetaComidaLabel } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  ETIQUETA_ALTO_CAPTURA_PX,
  ETIQUETA_ANCHO_CAPTURA_PX,
  ETIQUETA_QR_COL_RATIO,
  dimensionesEtiquetaPantalla,
  pxCapturaImpresion,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"
import {
  ELEMENTOS_IMPRESION,
  estiloCodigoEtiqueta,
  TIPOGRAFIA_IMPRESION,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetaImpresionLayout"
import {
  textoDocumentoEtiqueta,
  textoIngresoEtiqueta,
} from "@/modules/dietas-cocina/etiquetas/lib/textoIdentificacionEtiqueta"

export interface EtiquetaLabelFaceProps {
  etiqueta: EtiquetaDieta
  qrSrc: string
  /** `impresion` → PDF 168×88 mm; `pantalla` → preview 120×80 mm. */
  modo?: "pantalla" | "impresion"
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

const ICONO_PX = 10
const LINEA_META_PX = 12

function IconoBase({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: ICONO_PX,
        height: LINEA_META_PX,
        flexShrink: 0,
      }}
    >
      <svg
        width={ICONO_PX}
        height={ICONO_PX}
        viewBox="0 0 24 24"
        fill="none"
        stroke={C.black50}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{ display: "block" }}
        {...props}
      >
        {children}
      </svg>
    </span>
  )
}

function IconoIdCard() {
  return (
    <IconoBase>
      <rect width={18} height={13} x={3} y={5} rx={2} />
      <path d="M7 10h4" />
      <path d="M7 14h6" />
    </IconoBase>
  )
}

function IconoCalendar() {
  return (
    <IconoBase>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width={18} height={18} x={3} y={4} rx={2} />
      <path d="M3 10h18" />
    </IconoBase>
  )
}

function IconoMapPin() {
  return (
    <IconoBase>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx={12} cy={10} r={3} />
    </IconoBase>
  )
}

function IconoUser() {
  return (
    <IconoBase>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </IconoBase>
  )
}

function IconoShield() {
  return (
    <IconoBase>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </IconoBase>
  )
}

function IconoMessage() {
  return (
    <IconoBase stroke={C.black}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </IconoBase>
  )
}

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        height: LINEA_META_PX,
        lineHeight: `${LINEA_META_PX}px`,
        fontSize: 8.5,
      }}
    >
      {icon}
      <span style={{ lineHeight: `${LINEA_META_PX}px` }}>{children}</span>
    </span>
  )
}

function Separador() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: LINEA_META_PX,
        color: C.black25,
        margin: "0 4px",
        lineHeight: 1,
      }}
    >
      |
    </span>
  )
}

function BadgeEscanear({ esImpresion = false }: { esImpresion?: boolean }) {
  if (esImpresion) {
    return (
      <div
        style={{
          display: "inline-block",
          background: C.black,
          color: C.white,
          fontSize: ELEMENTOS_IMPRESION.badgeFontSize,
          fontWeight: 700,
          fontFamily: "Arial, Helvetica, sans-serif",
          letterSpacing: "0.04em",
          lineHeight: 1.2,
          padding: `${ELEMENTOS_IMPRESION.badgePadV}px ${ELEMENTOS_IMPRESION.badgePadH}px`,
          borderRadius: ELEMENTOS_IMPRESION.badgeRadius,
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        ESCANEAR
      </div>
    )
  }

  return (
    <svg
      width={72}
      height={20}
      viewBox="0 0 84 22"
      role="img"
      aria-label="Escanear"
      style={{ display: "block" }}
    >
      <rect x={0} y={0} width={84} height={22} rx={5} fill={C.black} />
      <text
        x={42}
        y={15}
        textAnchor="middle"
        fill={C.white}
        fontSize={8}
        fontWeight={700}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.3"
      >
        ESCANEAR
      </text>
    </svg>
  )
}

function SeparadorImpresion() {
  return (
    <span
      aria-hidden
      style={{
        color: C.black25,
        margin: `0 ${pxCapturaImpresion(5)}px`,
        fontWeight: 400,
      }}
    >
      |
    </span>
  )
}

function MetaPaciente({
  etiqueta,
  ubicacion,
  modo,
}: {
  etiqueta: EtiquetaDieta
  ubicacion: string
  modo: "pantalla" | "impresion"
}) {
  const aislamiento = etiqueta.aislamiento ? "Sí" : "No"
  const ingreso = textoIngresoEtiqueta(etiqueta)
  const documento = textoDocumentoEtiqueta(etiqueta)

  if (modo === "impresion") {
    const estiloMeta: CSSProperties = {
      margin: 0,
      fontSize: TIPOGRAFIA_IMPRESION.meta,
      fontWeight: 700,
      lineHeight: 1.3,
      color: C.black85,
    }

    return (
      <div
        style={{
          paddingBottom: pxCapturaImpresion(4),
          flexShrink: 0,
        }}
      >
        <p style={estiloMeta}>
          {ingreso ? (
            <>
              {ingreso}
              <SeparadorImpresion />
            </>
          ) : null}
          Edad: {etiqueta.edad}
          <SeparadorImpresion />
          {documento}
        </p>
        <p style={{ ...estiloMeta, marginTop: pxCapturaImpresion(3) }}>
          {ubicacion}
          <SeparadorImpresion />
          Aislamiento: {aislamiento}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        paddingBottom: 4,
        fontSize: 8.5,
        lineHeight: 1.35,
        color: C.black85,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 2,
          rowGap: 2,
          marginBottom: 2,
        }}
      >
        <MetaItem icon={<IconoIdCard />}>
          {ingreso ?? documento}
        </MetaItem>
        <Separador />
        <MetaItem icon={<IconoCalendar />}>Edad: {etiqueta.edad}</MetaItem>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 2,
          rowGap: 2,
          marginBottom: 2,
        }}
      >
        <MetaItem icon={<IconoMapPin />}>{ubicacion}</MetaItem>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 2,
          rowGap: 2,
        }}
      >
        {ingreso ? (
          <>
            <MetaItem icon={<IconoUser />}>{documento}</MetaItem>
            <Separador />
          </>
        ) : null}
        <MetaItem icon={<IconoShield />}>Aislamiento: {aislamiento}</MetaItem>
      </div>
    </div>
  )
}

function EtiquetaLabelContenido({
  etiqueta,
  qrSrc,
  qrSize,
  fontFamily,
  modo,
}: {
  etiqueta: EtiquetaDieta
  qrSrc: string
  qrSize: number
  fontFamily: string
  modo: "pantalla" | "impresion"
}) {
  const esImpresion = modo === "impresion"
  const comida = etiquetaComidaLabel(etiqueta.comida)
  const ubicacion = `${etiqueta.pabellon} - Hab ${etiqueta.habitacion}`
  const pxI = (valor: number) => pxCapturaImpresion(valor)
  const padContenido = esImpresion
    ? `${pxI(10)}px ${pxI(12)}px ${pxI(10)}px`
    : "8px 10px 8px"
  const padDieta = esImpresion ? `${pxI(6)}px ${pxI(9)}px` : "5px 7px"
  const padObs = esImpresion
    ? `${pxI(6)}px ${pxI(9)}px ${pxI(7)}px`
    : "5px 7px 6px"
  const mtObs = esImpresion ? pxI(6) : 5
  const mtNombre = esImpresion ? pxI(4) : 4
  const pbHeader = esImpresion ? pxI(5) : 5
  const pbQr = esImpresion ? pxI(4) : 2
  const gapHeader = esImpresion ? pxI(6) : 6
  const bordePx = esImpresion ? pxI(1) : 1
  const logoAlto = esImpresion ? ELEMENTOS_IMPRESION.logoAlto : 26

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: esImpresion ? pxI(6) : 6,
        display: "grid",
        gridTemplateColumns: `minmax(0, 1fr) ${QR_COL}`,
        fontFamily,
      }}
    >
      <div
        style={{
          minWidth: 0,
          boxSizing: "border-box",
          padding: padContenido,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: gapHeader,
            borderBottom: `${bordePx}px solid ${C.black15}`,
            paddingBottom: pbHeader,
            flexShrink: 0,
          }}
        >
          <img
            src={logoClinica}
            alt="Clínica del Río"
            style={{
              display: "block",
              height: logoAlto,
              width: "auto",
              maxWidth: esImpresion ? pxI(120) : 108,
              objectFit: "contain",
              objectPosition: "left center",
            }}
          />
          <div style={{ flexShrink: 0, textAlign: "right", lineHeight: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.comida : 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "-0.025em",
              }}
            >
              {comida}
            </p>
            <p
              style={{
                margin: esImpresion ? `${pxI(2)}px 0 0` : "2px 0 0",
                fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.fechaHora : 8.5,
                fontWeight: esImpresion ? 700 : 400,
                color: esImpresion ? C.black85 : C.black65,
              }}
            >
              {formatearFechaHoraEnCadena(etiqueta.fechaHora)}
            </p>
          </div>
        </div>

        <h3
          style={{
            marginTop: mtNombre,
            marginBottom: esImpresion ? pxI(3) : 4,
            fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.paciente : 11,
            fontWeight: 700,
            textTransform: "uppercase",
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            flexShrink: 0,
          }}
        >
          {etiqueta.paciente}
        </h3>

        <MetaPaciente etiqueta={etiqueta} ubicacion={ubicacion} modo={modo} />

        <div
          style={{
            border: `${bordePx}px solid ${C.black}`,
            borderRadius: esImpresion ? pxI(2) : 2,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div
              style={{
                minWidth: 0,
                padding: padDieta,
                borderRight: `${bordePx}px solid ${C.black}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.dietaLabel : 8,
                  fontWeight: esImpresion ? 700 : 500,
                  textTransform: "uppercase",
                  letterSpacing: esImpresion ? undefined : "0.05em",
                  color: esImpresion ? C.black85 : C.black55,
                  lineHeight: esImpresion ? 1 : undefined,
                }}
              >
                Dieta:
              </p>
              <p
                style={{
                  margin: "1px 0 0",
                  fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.dietaValor : 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {etiqueta.tipoDieta}
              </p>
            </div>
            <div style={{ minWidth: 0, padding: padDieta }}>
              <p
                style={{
                  margin: 0,
                  fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.dietaLabel : 8,
                  fontWeight: esImpresion ? 700 : 500,
                  textTransform: "uppercase",
                  letterSpacing: esImpresion ? undefined : "0.05em",
                  color: esImpresion ? C.black85 : C.black55,
                  lineHeight: esImpresion ? 1 : undefined,
                }}
              >
                Consistencia:
              </p>
              <p
                style={{
                  margin: "1px 0 0",
                  fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.dietaValor : 10,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {etiqueta.consistencia}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: mtObs,
            border: `${bordePx}px solid ${C.black}`,
            borderRadius: esImpresion ? pxI(2) : 2,
            padding: padObs,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {esImpresion ? (
            <p
              style={{
                margin: 0,
                fontSize: TIPOGRAFIA_IMPRESION.obsLabel,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                color: C.black,
                flexShrink: 0,
              }}
            >
              Observaciones
            </p>
          ) : (
            <p
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: LINEA_META_PX,
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <IconoMessage />
              Observaciones
            </p>
          )}
          <p
            style={{
              margin: esImpresion ? `${pxI(3)}px 0 0` : "3px 0 0",
              fontSize: esImpresion ? TIPOGRAFIA_IMPRESION.obsTexto : 9,
              fontWeight: esImpresion ? 700 : 400,
              lineHeight: esImpresion ? 1.3 : 1.35,
              color: C.black85,
              flex: 1,
              overflow: esImpresion ? "hidden" : undefined,
              display: esImpresion ? "-webkit-box" : undefined,
              WebkitLineClamp: esImpresion ? 5 : undefined,
              WebkitBoxOrient: esImpresion ? "vertical" : undefined,
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
          borderLeft: `${bordePx}px solid ${C.black}`,
          height: "100%",
          boxSizing: "border-box",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: esImpresion ? pxI(8) : 8,
            paddingBottom: pbQr,
            flexShrink: 0,
          }}
        >
          <BadgeEscanear esImpresion={esImpresion} />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: esImpresion ? `0 ${pxI(6)}px` : "0 6px",
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
                imageRendering: esImpresion ? "pixelated" : undefined,
              }}
            />
          ) : (
            <div
              style={{
                width: qrSize,
                height: qrSize,
                background: C.black15,
              }}
            />
          )}
        </div>

        <p style={estiloCodigoEtiqueta(etiqueta.codigo, esImpresion)}>
          {etiqueta.codigo}
        </p>
      </div>
    </div>
  )
}

export function EtiquetaLabelFace({
  etiqueta,
  qrSrc,
  modo = "pantalla",
}: EtiquetaLabelFaceProps) {
  const esImpresion = modo === "impresion"
  const { ancho: anchoPantalla, alto: altoPantalla } = dimensionesEtiquetaPantalla()
  const ancho = esImpresion ? ETIQUETA_ANCHO_CAPTURA_PX : anchoPantalla
  const alto = esImpresion ? ETIQUETA_ALTO_CAPTURA_PX : altoPantalla
  const qrSize = esImpresion ? ELEMENTOS_IMPRESION.qrSize : 88
  const fontFamily = esImpresion
    ? "Arial, Helvetica, sans-serif"
    : '"Geist Variable", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'

  const cajaEtiqueta = (
    <div
      data-etiqueta-print={esImpresion ? true : undefined}
      data-etiqueta-id={esImpresion ? undefined : etiqueta.id}
      style={{
        boxSizing: "border-box",
        width: ancho,
        height: alto,
        border: esImpresion ? "none" : "2px solid rgba(0, 0, 0, 0.8)",
        borderRadius: esImpresion ? 0 : 8,
        WebkitFontSmoothing: esImpresion ? "antialiased" : undefined,
        textRendering: esImpresion ? "geometricPrecision" : undefined,
        background: C.white,
        color: C.black,
        fontFamily,
      }}
    >
      <EtiquetaLabelContenido
        etiqueta={etiqueta}
        qrSrc={qrSrc}
        qrSize={qrSize}
        fontFamily={fontFamily}
        modo={modo}
      />
    </div>
  )

  return cajaEtiqueta
}
