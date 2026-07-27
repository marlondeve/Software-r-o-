import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"

export function usarAuthModuloApi(): boolean {
  return usarApiDietasCocina()
}
