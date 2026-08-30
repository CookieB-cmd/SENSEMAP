/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_MAP_STYLE_URL: string
  readonly VITE_RELEASE_CHANNEL?: 'rc'
  readonly VITE_RELEASE_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
