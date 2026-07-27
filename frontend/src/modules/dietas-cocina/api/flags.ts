/** Flag de entorno sin dependencias del barrel api/ (evita ciclos con context). */
export function usarApiDietasCocina(): boolean {
  return import.meta.env.VITE_DIETAS_COCINA_API === "true"
}
