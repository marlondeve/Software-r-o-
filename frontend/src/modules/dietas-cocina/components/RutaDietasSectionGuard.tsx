import type { ReactNode } from "react"

import { SectionPage } from "@/components/shared/SectionPage"
import { SectionPageSkeleton } from "@/components/shared/skeletons"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import { rutaDietasPermitida } from "@/modules/dietas-cocina/lib/permisos"
import {
  obtenerMatrizPermisosApi,
  useMatrizPermisosVersion,
} from "@/modules/dietas-cocina/lib/permisosMatrizCache"
import type { RutaDietas } from "@/modules/dietas-cocina/types/enums"

interface RutaDietasSectionGuardProps {
  segmento: RutaDietas
  title: string
  description?: string
  children: ReactNode
}

/** Muestra la sección solo si el rol tiene permiso API/local para esa ruta del sidebar. */
export function RutaDietasSectionGuard({
  segmento,
  title,
  description = "No tiene permisos para esta sección.",
  children,
}: RutaDietasSectionGuardProps) {
  const rol = useRolVistaEfectivo()
  useMatrizPermisosVersion()
  const apiActiva = usarApiDietasCocina()
  const matriz = obtenerMatrizPermisosApi()

  if (apiActiva && matriz === null) {
    return <SectionPageSkeleton title={title} />
  }

  if (!rutaDietasPermitida(rol, segmento)) {
    return <SectionPage title={title} description={description} />
  }

  return children
}
