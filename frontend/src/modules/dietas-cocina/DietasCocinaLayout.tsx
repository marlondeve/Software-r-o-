import { Outlet } from "react-router-dom"

import { CicloBandejasProvider } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { DietasOperativasProvider } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { SincronizarCocinaDesdeDietas } from "@/modules/dietas-cocina/context/SincronizarCocinaDesdeDietas"

/** Envuelve todas las rutas de dietas-cocina con el store compartido del ciclo de bandejas. */
export function DietasCocinaLayout() {
  return (
    <CicloBandejasProvider>
      <DietasOperativasProvider>
        <SincronizarCocinaDesdeDietas />
        <Outlet />
      </DietasOperativasProvider>
    </CicloBandejasProvider>
  )
}
