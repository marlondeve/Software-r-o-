export type TipoErrorCamara =
  | "inseguro"
  | "no_soportado"
  | "denegado"
  | "no_encontrada"
  | "ocupada"
  | "desconocido"

export interface DiagnosticoCamara {
  puedeUsarCamara: boolean
  tipo?: TipoErrorCamara
  mensaje?: string
  sugerencia?: string
}

export function esContextoCamaraInseguro(): boolean {
  return typeof window !== "undefined" && !window.isSecureContext
}

function mensajeContextoInseguro(): DiagnosticoCamara {
  const host = typeof window !== "undefined" ? window.location.host : "tu-servidor"
  return {
    puedeUsarCamara: false,
    tipo: "inseguro",
    mensaje:
      "No se pudo usar la cámara en una conexión HTTP (no segura).",
    sugerencia: `Abre la app por HTTPS (https://${host}/…) o usa ingreso manual. En localhost la cámara funciona para pruebas.`,
  }
}

/** Solo valida soporte del navegador; no bloquea HTTP antes de intentar la cámara. */
export function diagnosticarEntornoCamara(): DiagnosticoCamara {
  if (typeof window === "undefined") {
    return {
      puedeUsarCamara: false,
      tipo: "no_soportado",
      mensaje: "Entorno sin navegador.",
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      puedeUsarCamara: false,
      tipo: "no_soportado",
      mensaje: "Este navegador no expone acceso a la cámara.",
      sugerencia: "Prueba con Chrome/Edge actualizado o usa ingreso manual.",
    }
  }

  return { puedeUsarCamara: true }
}

export function interpretarErrorCamara(error: unknown): DiagnosticoCamara {
  const diagnosticoBase = diagnosticarEntornoCamara()
  if (!diagnosticoBase.puedeUsarCamara) return diagnosticoBase

  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        if (esContextoCamaraInseguro()) {
          return mensajeContextoInseguro()
        }
        return {
          puedeUsarCamara: false,
          tipo: "denegado",
          mensaje: "Permiso de cámara denegado.",
          sugerencia:
            "Habilita la cámara en el icono del candado/barra de dirección y pulsa Reintentar.",
        }
      case "NotFoundError":
      case "DevicesNotFoundError":
        return {
          puedeUsarCamara: false,
          tipo: "no_encontrada",
          mensaje: "No se detectó ninguna cámara en el dispositivo.",
          sugerencia: "Usa ingreso manual o conecta una cámara web.",
        }
      case "NotReadableError":
      case "TrackStartError":
        return {
          puedeUsarCamara: false,
          tipo: "ocupada",
          mensaje: "La cámara está en uso por otra aplicación.",
          sugerencia: "Cierra otras apps que usen la cámara y reintenta.",
        }
      case "SecurityError":
        return mensajeContextoInseguro()
      default:
        break
    }
  }

  if (esContextoCamaraInseguro()) {
    return mensajeContextoInseguro()
  }

  return {
    puedeUsarCamara: false,
    tipo: "desconocido",
    mensaje: "No se pudo iniciar la cámara.",
    sugerencia: "Reintenta o ingresa el código manualmente.",
  }
}
