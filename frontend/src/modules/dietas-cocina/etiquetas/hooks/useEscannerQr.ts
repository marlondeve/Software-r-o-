import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface UseEscannerQrOptions {
  onCodigoLeido: (codigo: string) => void
  activo?: boolean
}

export function useEscannerQr({
  onCodigoLeido,
  activo = true,
}: UseEscannerQrOptions) {
  const reactId = useId()
  const contenedorId = `qr-reader-${reactId.replace(/:/g, "")}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const ultimoCodigoRef = useRef<string>("")
  const ultimoTiempoRef = useRef<number>(0)
  const [iniciando, setIniciando] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [camaraTrasera, setCamaraTrasera] = useState(true)
  const [linternaActiva, setLinternaActiva] = useState(false)

  const detener = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
      scanner.clear()
    } catch {
      // ignorar errores al detener
    }
    scannerRef.current = null
    setLinternaActiva(false)
  }, [])

  const iniciar = useCallback(async () => {
    if (!activo) return
    await detener()
    setIniciando(true)
    setErrorCamara(null)

    const scanner = new Html5Qrcode(contenedorId)
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: camaraTrasera ? "environment" : "user" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          const ahora = Date.now()
          if (
            decoded === ultimoCodigoRef.current &&
            ahora - ultimoTiempoRef.current < 2500
          ) {
            return
          }
          ultimoCodigoRef.current = decoded
          ultimoTiempoRef.current = ahora
          onCodigoLeido(decoded)
        },
        () => {
          // sin QR en frame
        },
      )
    } catch {
      setErrorCamara(
        "No se pudo acceder a la cámara. Usa el ingreso manual del código.",
      )
    } finally {
      setIniciando(false)
    }
  }, [activo, camaraTrasera, contenedorId, detener, onCodigoLeido])

  useEffect(() => {
    if (activo) {
      void iniciar()
    } else {
      void detener()
    }
    return () => {
      void detener()
    }
  }, [activo, camaraTrasera, iniciar, detener])

  const alternarCamara = useCallback(() => {
    setCamaraTrasera((prev) => !prev)
  }, [])

  const alternarLinterna = useCallback(async () => {
    if (!scannerRef.current?.isScanning) return

    try {
      const video = document
        .getElementById(contenedorId)
        ?.querySelector("video") as HTMLVideoElement | null
      const track = (video?.srcObject as MediaStream | null)?.getVideoTracks()[0]
      if (!track) return

      const capabilities = track.getCapabilities?.() as
        | MediaTrackCapabilities
        | undefined
      if (!capabilities?.torch) return

      const next = !linternaActiva
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      })
      setLinternaActiva(next)
    } catch {
      // linterna no soportada
    }
  }, [contenedorId, linternaActiva])

  return {
    contenedorId,
    iniciando,
    errorCamara,
    alternarCamara,
    alternarLinterna,
  }
}
