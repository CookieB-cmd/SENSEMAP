import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^maplibre-gl$/,
        replacement: fileURLToPath(new URL('./node_modules/maplibre-gl/dist/maplibre-gl-csp.js', import.meta.url)),
      },
    ],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'SENSEMAP', short_name: 'SENSEMAP', description: 'Know the place before you go',
        start_url: '/', display: 'standalone', theme_color: '#ffffff', background_color: '#ffffff',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { navigateFallback: '/index.html', runtimeCaching: [] },
    }),
  ],
})
