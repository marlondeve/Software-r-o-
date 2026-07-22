import { useCallback, useEffect, useState } from "react"

import {
  cargarConfigAccesoModulos,
  guardarConfigAccesoModulos,
  obtenerConfigAccesoDefault,
  restablecerConfigAccesoModulos,
  type ConfigAccesoModulos,
} from "@/lib/configAccesoModulos"

const CONFIG_EVENT = "bital:config-acceso-actualizada"

export function useConfigAccesoModulos() {
  const [config, setConfig] = useState<ConfigAccesoModulos>(() =>
    cargarConfigAccesoModulos(),
  )

  useEffect(() => {
    function sincronizar() {
      setConfig(cargarConfigAccesoModulos())
    }

    window.addEventListener(CONFIG_EVENT, sincronizar)
    return () => window.removeEventListener(CONFIG_EVENT, sincronizar)
  }, [])

  const actualizar = useCallback((nuevaConfig: ConfigAccesoModulos) => {
    guardarConfigAccesoModulos(nuevaConfig)
    setConfig(nuevaConfig)
    window.dispatchEvent(new Event(CONFIG_EVENT))
  }, [])

  const restablecer = useCallback(() => {
    const defaultConfig = restablecerConfigAccesoModulos()
    setConfig(defaultConfig)
    window.dispatchEvent(new Event(CONFIG_EVENT))
    return defaultConfig
  }, [])

  return {
    config,
    actualizar,
    restablecer,
    configDefault: obtenerConfigAccesoDefault(),
  }
}

export function obtenerConfigAccesoModulos(): ConfigAccesoModulos {
  return cargarConfigAccesoModulos()
}
