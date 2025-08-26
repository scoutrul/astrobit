/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Динамические типы для всех VITE_ переменных окружения
  readonly [key: `VITE_${string}`]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 