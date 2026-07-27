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
  const onCodigoLeidoRef = useRef(onCodigoLeido)
  const activoRef = useRef(activo)
  const escaneoPermitidoRef = useRef(false)
  const iniciandoRef = useRef(false)
  const [iniciando, setIniciando] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [camaraTrasera, setCamaraTrasera] = useState(true)
  const [linternaActiva, setLinternaActiva] = useState(false)

  onCodigoLeidoRef.current = onCodigoLeido
  activoRef.current = activo

  const limpiarContenedor = useCallback(() => {
    const contenedor = document.getElementById(contenedorId)
    if (contenedor) {
      contenedor.innerHTML = ""
    }
  }, [contenedorId])

  const detener = useCallback(async () => {
    escaneoPermitidoRef.current = false
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) {
      limpiarContenedor()
      return
    }
    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
      scanner.clear()
    } catch {
      // ignorar errores al detener
    }
    limpiarContenedor()
    setLinternaActiva(false)
  }, [limpiarContenedor])

  useEffect(() => {
    if (!activo) {
      void detener()
      return
    }

    let cancelado = false

    async function iniciarCamara() {
      if (iniciandoRef.current) return
      iniciandoRef.current = true
      setIniciando(true)
      setErrorCamara(null)

      await detener()
      if (cancelado) {
        iniciandoRef.current = false
        setIniciando(false)
        return
      }

      const scanner = new Html5Qrcode(contenedorId)
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: camaraTrasera ? "environment" : "user" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (!escaneoPermitidoRef.current || !activoRef.current) return
            const ahora = Date.now()
            if (
              decoded === ultimoCodigoRef.current &&
              ahora - ultimoTiempoRef.current < 4000
            ) {
              return
            }
            ultimoCodigoRef.current = decoded
            ultimoTiempoRef.current = ahora
            if (!escaneoPermitidoRef.current || !activoRef.current) return
            onCodigoLeidoRef.current(decoded)
          },
          () => {
            // sin QR en frame
          },
        )
        escaneoPermitidoRef.current = true
      } catch {
        if (!cancelado) {
          setErrorCamara(
            "No se pudo acceder a la cámara. Usa el ingreso manual del código.",
          )
        }
        await detener()
      } finally {
        iniciandoRef.current = false
        if (!cancelado) {
          setIniciando(false)
        }
      }
    }

    void iniciarCamara()

    return () => {
      cancelado = true
      void detener()
    }
  }, [activo, camaraTrasera, contenedorId, detener])

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
        | (MediaTrackCapabilities & { torch?: boolean })
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
