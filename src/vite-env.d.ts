/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSFORGE_URL: string;
  readonly VITE_INSFORGE_ANON_KEY: string;
  readonly VITE_AI_MODEL: string;
  readonly VITE_DEFAULT_ROLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
