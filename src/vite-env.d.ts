/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'live' | 'auto'
  readonly VITE_MOEX_USER?: string
  readonly VITE_MOEX_PASSWORD?: string
  readonly VITE_MOEX_ISS_BASE_URL?: string
  readonly VITE_MOEX_CCI_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
