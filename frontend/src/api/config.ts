const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080/api/v1"
  : "/api/v1"

const DEFAULT_HEALTH_URL = import.meta.env.DEV
  ? "http://localhost:8080/health"
  : "/health"

export const apiBaseUrl =
  import.meta.env.VITE_BITAL_API_BASE_URL ?? DEFAULT_API_BASE_URL

export const healthUrl =
  import.meta.env.VITE_BITAL_API_HEALTH_URL ?? DEFAULT_HEALTH_URL
