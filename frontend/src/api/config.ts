const DEFAULT_API_BASE_URL = "http://186.190.254.230:8080/api/v1"
const DEFAULT_HEALTH_URL = "http://186.190.254.230:8080/health"

export const apiBaseUrl =
  import.meta.env.VITE_BITAL_API_BASE_URL ?? DEFAULT_API_BASE_URL

export const healthUrl =
  import.meta.env.VITE_BITAL_API_HEALTH_URL ?? DEFAULT_HEALTH_URL
