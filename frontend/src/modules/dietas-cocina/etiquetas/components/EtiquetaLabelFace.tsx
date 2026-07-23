import type { ReactNode, SVGProps } from "react"

import logoClinica from "@/assets/Logo-Clinica-del-Rio.png"
import {
  etiquetaComidaLabel,
  type EtiquetaDieta,
} from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  ETIQUETA_QR_COL_RATIO,
  dimensionesEtiquetaPantalla,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"

export interface EtiquetaLabelFaceProps {
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

const ICONO_PX = 11
const LINEA_META_PX = 14

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
        fontSize: 9.5,
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

/** Vista en pantalla — no modificar para impresión (ver EtiquetaLabelFaceImpresion). */
export function EtiquetaLabelFace({ etiqueta, qrSrc }: EtiquetaLabelFaceProps) {
  const comida = etiquetaComidaLabel(etiqueta.comida)
  const ubicacion = `${etiqueta.pabellon} - Hab ${etiqueta.habitacion}`
  const { ancho, alto } = dimensionesEtiquetaPantalla()
  const qrSize = 98

  return (
    <div
      data-etiqueta-id={etiqueta.id}
      style={{
        boxSizing: "border-box",
        width: ancho,
        height: alto,
        border: "2px solid rgba(0, 0, 0, 0.8)",
        borderRadius: 8,
        background: C.white,
        color: C.black,
        fontFamily:
          '"Geist Variable", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
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
            padding: "9px 11px 7px",
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
              paddingBottom: 6,
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
                  letterSpacing: "-0.025em",
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
              marginTop: 6,
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              lineHeight: 1.3,
              letterSpacing: "-0.025em",
              flexShrink: 0,
            }}
          >
            {etiqueta.paciente}
          </h3>

          <div
            style={{
              paddingBottom: 6,
              fontSize: 9.5,
              lineHeight: 1.45,
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
              <MetaItem icon={<IconoIdCard />}>ID: {etiqueta.pacienteId}</MetaItem>
              <Separador />
              <MetaItem icon={<IconoCalendar />}>Edad: {etiqueta.edad}</MetaItem>
              <Separador />
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
              <MetaItem icon={<IconoUser />}>CC: {etiqueta.documento}</MetaItem>
              <Separador />
              <MetaItem icon={<IconoShield />}>
                Aislamiento: {etiqueta.aislamiento ? "Sí" : "No"}
              </MetaItem>
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${C.black}`,
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div
                style={{
                  minWidth: 0,
                  padding: "6px 8px",
                  borderRight: `1px solid ${C.black}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 9,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: C.black55,
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
                    wordBreak: "break-word",
                  }}
                >
                  {etiqueta.tipoDieta}
                </p>
              </div>
              <div style={{ minWidth: 0, padding: "6px 8px" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 9,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: C.black55,
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
              marginTop: 6,
              border: `1px solid ${C.black}`,
              borderRadius: 2,
              padding: "6px 8px",
              flexShrink: 0,
            }}
          >
            <p
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: LINEA_META_PX,
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <IconoMessage />
              Observaciones
            </p>
            <p
              style={{
                margin: "4px 0 0",
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
              paddingBottom: 2,
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

          <p
            style={{
              margin: 0,
              padding: "0 6px 6px",
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
  )
}
