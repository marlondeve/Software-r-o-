import { useCallback, useEffect, useRef, useState } from "react"

import { checkHealth } from "@/api/health.service"

const EVENTO_CONECTIVIDAD = "bital:conectividad-cambio"

function leerNavigatorOnline(): boolean {
  if (typeof navigator === "undefined") return true
  return navigator.onLine
}

async function verificarConectividadReal(): Promise<boolean> {
  if (!leerNavigatorOnline()) return false
  try {
    await checkHealth()
    return true
  } catch {
    return false
  }
}

/** Hook reactivo al estado de red del navegador (con verificación opcional al reconectar). */
export function useConectividadRed(opciones?: { verificarAlReconectar?: boolean }) {
  const verificarAlReconectar = opciones?.verificarAlReconectar ?? true
  const [estaOnline, setEstaOnline] = useState(leerNavigatorOnline)
  const verificandoRef = useRef(false)

  const actualizarEstado = useCallback((online: boolean) => {
    setEstaOnline(online)
    window.dispatchEvent(
      new CustomEvent(EVENTO_CONECTIVIDAD, { detail: { online } }),
    )
  }, [])

  useEffect(() => {
    function manejarOffline() {
      actualizarEstado(false)
    }

    async function manejarOnline() {
      if (!verificarAlReconectar) {
        actualizarEstado(true)
        return
      }
      if (verificandoRef.current) return
      verificandoRef.current = true
      const online = await verificarConectividadReal()
      verificandoRef.current = false
      actualizarEstado(online)
    }

    window.addEventListener("offline", manejarOffline)
    window.addEventListener("online", manejarOnline)

    return () => {
      window.removeEventListener("offline", manejarOffline)
      window.removeEventListener("online", manejarOnline)
    }
  }, [actualizarEstado, verificarAlReconectar])

  return estaOnline
}

/** Suscripción imperativa para lógica fuera de React (p. ej. contexto). */
export function suscribirConectividadRed(
  callback: (online: boolean) => void,
): () => void {
  function manejarEvento(event: Event) {
    const custom = event as CustomEvent<{ online: boolean }>
    callback(custom.detail?.online ?? leerNavigatorOnline())
  }

  function manejarOffline() {
    callback(false)
  }

  function manejarOnline() {
    callback(leerNavigatorOnline())
  }

  window.addEventListener(EVENTO_CONECTIVIDAD, manejarEvento)
  window.addEventListener("offline", manejarOffline)
  window.addEventListener("online", manejarOnline)

  return () => {
    window.removeEventListener(EVENTO_CONECTIVIDAD, manejarEvento)
    window.removeEventListener("offline", manejarOffline)
    window.removeEventListener("online", manejarOnline)
  }
}

export function estaOnlineAhora(): boolean {
  return leerNavigatorOnline()
}
