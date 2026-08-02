import type {
  EstadoSyncBandeja,
  OperacionBandejaPendiente,
} from "@/modules/dietas-cocina/types/tray-cycle"

const STORAGE_KEY = "dietas-cocina-bandejas-outbox"
const EVENTO_OUTBOX = "bital:bandejas-outbox-cambio"

function notificarCambio(): void {
  window.dispatchEvent(new CustomEvent(EVENTO_OUTBOX))
}

export function listarOperacionesPendientes(): OperacionBandejaPendiente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OperacionBandejaPendiente[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function guardarOperaciones(operaciones: OperacionBandejaPendiente[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(operaciones))
  notificarCambio()
}

export function encolarOperacionBandeja(
  operacion: OperacionBandejaPendiente,
): void {
  const actuales = listarOperacionesPendientes()
  guardarOperaciones([...actuales, operacion])
}

export function eliminarOperacionBandeja(clientId: string): void {
  const actuales = listarOperacionesPendientes()
  guardarOperaciones(actuales.filter((op) => op.clientId !== clientId))
}

export function actualizarOperacionBandeja(
  clientId: string,
  parcial: {
    intentos?: number
    ultimoError?: string
    estadoSync?: EstadoSyncBandeja
  },
): void {
  const actuales = listarOperacionesPendientes()
  guardarOperaciones(
    actuales.map((op) =>
      op.clientId === clientId ? { ...op, ...parcial } : op,
    ),
  )
}

export function contarOperacionesPendientes(): number {
  return listarOperacionesPendientes().filter(
    (op) => op.estadoSync !== "conflicto",
  ).length
}

export function contarOperacionesConConflicto(): number {
  return listarOperacionesPendientes().filter(
    (op) => op.estadoSync === "conflicto",
  ).length
}

export function listarOperacionesConConflicto(): OperacionBandejaPendiente[] {
  return listarOperacionesPendientes().filter(
    (op) => op.estadoSync === "conflicto",
  )
}

export function descartarOperacionBandeja(clientId: string): void {
  eliminarOperacionBandeja(clientId)
}

export function reintentarOperacionBandeja(clientId: string): void {
  const actuales = listarOperacionesPendientes()
  guardarOperaciones(
    actuales.map((op) =>
      op.clientId === clientId
        ? { ...op, estadoSync: "pendiente" as const, ultimoError: undefined }
        : op,
    ),
  )
}

export function suscribirOutboxBandejas(callback: () => void): () => void {
  window.addEventListener(EVENTO_OUTBOX, callback)
  return () => window.removeEventListener(EVENTO_OUTBOX, callback)
}

export function crearClientIdBandeja(): string {
  return `bandeja-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function archivoABase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        const base64 = result.includes(",") ? result.split(",")[1]! : result
        resolve(base64)
      } else {
        reject(new Error("No se pudo leer el archivo"))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error("Error al leer archivo"))
    reader.readAsDataURL(archivo)
  })
}

export function base64AFile(
  base64: string,
  nombre: string,
  tipo: string,
): File {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i)
  }
  return new File([bytes], nombre, { type: tipo })
}
