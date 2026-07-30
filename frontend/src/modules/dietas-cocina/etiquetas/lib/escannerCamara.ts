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

export function diagnosticarEntornoCamara(): DiagnosticoCamara {
  if (typeof window === "undefined") {
    return {
      puedeUsarCamara: false,
      tipo: "no_soportado",
      mensaje: "Entorno sin navegador.",
    }
  }

  if (!window.isSecureContext) {
    const host = window.location.host
    return {
      puedeUsarCamara: false,
      tipo: "inseguro",
      mensaje:
        "El navegador bloquea la cámara porque la app se abrió por HTTP (conexión no segura).",
      sugerencia: `Usa HTTPS (https://${host}/…) o el ingreso manual del código. En localhost la cámara sí funciona para pruebas.`,
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
      default:
        break
    }
  }

  return {
    puedeUsarCamara: false,
    tipo: "desconocido",
    mensaje: "No se pudo iniciar la cámara.",
    sugerencia: "Reintenta o ingresa el código manualmente.",
  }
}
