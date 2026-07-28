/** Registro en consola solo en desarrollo (evita filtrar detalles en producción). */
export const devLog = {
  error(...args: unknown[]) {
    if (import.meta.env.DEV) {
      console.error(...args)
    }
  },
  warn(...args: unknown[]) {
    if (import.meta.env.DEV) {
      console.warn(...args)
    }
  },
}
