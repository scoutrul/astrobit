/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BYBIT_API_KEY?: string
  readonly VITE_BYBIT_API_SECRET?: string
  readonly VITE_BYBIT_TESTNET?: string
  readonly VITE_BYBIT_RECV_WINDOW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 