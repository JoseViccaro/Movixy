import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Movixy - Your Private Home Theater',
        short_name: 'Movixy',
        description: 'Premium streaming experience for your local media library.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'landscape',
        categories: ['entertainment', 'video'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Peliculas',
            short_name: 'Peliculas',
            url: '/movies',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Series',
            short_name: 'Series',
            url: '/series',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@data': path.resolve(__dirname, './src/data'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@core': path.resolve(__dirname, './src/core'),
    }
  },
  server: {
    host: true,
    proxy: {
      '/jellyfin': {
        target: 'http://localhost:8096',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jellyfin/, ''),
        ws: true, // Habilitar websockets por si Jellyfin los usa
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            // Aumentar el timeout para videos pesados
            req.setTimeout(30000);
          });
        },
      }
    }
  }
})

