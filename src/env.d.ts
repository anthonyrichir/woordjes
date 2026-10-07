/// <reference types="vite-plugin-pwa/vanillajs" />

interface ImportMetaEnv {
  readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Objet global injecté par le script Umami (absent si analytics désactivé ou hors ligne).
interface Window {
  umami?: { track: (event: string, data?: Record<string, string | number>) => void };
}
