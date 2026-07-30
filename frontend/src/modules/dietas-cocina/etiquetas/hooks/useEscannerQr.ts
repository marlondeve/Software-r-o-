import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

import {
  diagnosticarEntornoCamara,
  interpretarErrorCamara,
  type DiagnosticoCamara,
  type TipoErrorCamara,
} from "@/modules/dietas-cocina/etiquetas/lib/escannerCamara"

interface UseEscannerQrOptions {
  onCodigoLeido: (codigo: string) => void
  activo?: boolean
}

async function resolverDispositivoCamara(trasera: boolean): Promise<string | MediaTrackConstraints> {
  try {
    const cameras = await Html5Qrcode.getCameras()
    if (cameras.length === 0) {
      return { facingMode: trasera ? "environment" : "user" }
    }
    if (cameras.length === 1) return cameras[0].id

    const etiquetaTrasera = cameras.find((cam) =>
      /back|rear|environment|trasera|trase/i.test(cam.label),
    )
    const etiquetaFrontal = cameras.find((cam) =>
      /front|user|face|frontal|selfie/i.test(cam.label),
    )

    if (trasera && etiquetaTrasera) return etiquetaTrasera.id
    if (!trasera && etiquetaFrontal) return etiquetaFrontal.id
    return cameras[trasera ? cameras.length - 1 : 0].id
  } catch {
    return { facingMode: trasera ? "environment" : "user" }
  }
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
  const [intento, setIntento] = useState(0)
  const [iniciando, setIniciando] = useState(false)
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState<DiagnosticoCamara | null>(null)
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
    setCamaraActiva(false)
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
      setCamaraActiva(false)

      const entorno = diagnosticarEntornoCamara()
      if (!entorno.puedeUsarCamara) {
        setErrorCamara(entorno)
        iniciandoRef.current = false
        setIniciando(false)
        return
      }

      await detener()
      if (cancelado) {
        iniciandoRef.current = false
        setIniciando(false)
        return
      }

      const scanner = new Html5Qrcode(contenedorId)
      scannerRef.current = scanner

      try {
        const dispositivo = await resolverDispositivoCamara(camaraTrasera)
        await scanner.start(
          dispositivo,
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
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
        if (!cancelado) setCamaraActiva(true)
      } catch (error) {
        if (!cancelado) {
          setErrorCamara(interpretarErrorCamara(error))
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
  }, [activo, camaraTrasera, contenedorId, detener, intento])

  const reintentar = useCallback(() => {
    setIntento((prev) => prev + 1)
  }, [])

  const alternarCamara = useCallback(() => {
    if (!camaraActiva && !iniciando) {
      reintentar()
      return
    }
    setCamaraTrasera((prev) => !prev)
  }, [camaraActiva, iniciando, reintentar])

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
    camaraActiva,
    errorCamara,
    tipoError: errorCamara?.tipo as TipoErrorCamara | undefined,
    alternarCamara,
    alternarLinterna,
    reintentar,
  }
}
