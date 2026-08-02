import { Outlet } from "react-router-dom"

import { CicloBandejasProvider } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { DietasOperativasProvider } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { SincronizarBandejasPendientes } from "@/modules/dietas-cocina/context/SincronizarBandejasPendientes"
import { SincronizarCocinaDesdeDietas } from "@/modules/dietas-cocina/context/SincronizarCocinaDesdeDietas"
import { CargarPermisosRolesModulo } from "@/modules/dietas-cocina/components/CargarPermisosRolesModulo"

/** Envuelve todas las rutas de dietas-cocina con el store compartido del ciclo de bandejas. */
export function DietasCocinaLayout() {
  return (
    <CicloBandejasProvider>
      <DietasOperativasProvider>
        <CargarPermisosRolesModulo />
        <SincronizarCocinaDesdeDietas />
        <SincronizarBandejasPendientes />
        <Outlet />
      </DietasOperativasProvider>
    </CicloBandejasProvider>
  )
}
