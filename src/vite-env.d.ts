/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AOAI_ENDPOINT?: string;
  readonly VITE_AOAI_API_KEY?: string;
  readonly VITE_AOAI_DEPLOYMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
