/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BITAL_API_BASE_URL: string
  readonly VITE_BITAL_API_HEALTH_URL: string
  readonly VITE_DIETAS_COCINA_API: string
  readonly VITE_ENCUESTAS_ENABLED: string
  readonly VITE_ENCUESTAS_API: string
  readonly VITE_APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
