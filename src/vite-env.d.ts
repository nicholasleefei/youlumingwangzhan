/// <reference types="vite/client" />

declare const __PROXY_PORT__: string;

interface ImportMetaEnv {
  readonly VITE_PLATE_REPLACE_ENABLED?: string;
  readonly VITE_PLATE_REPLACE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
