// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // HTTPS in dev and preview: WebGPU needs a secure context, also on a phone over the LAN.
  plugins: [react(), basicSsl()],
  // The 3D lives in a lazy chunk: pre-bundle it at start, or the dev optimizer re-runs on first load.
  optimizeDeps: {
    include: ['@react-three/fiber', 'three', 'three/webgpu', 'three/tsl'],
  },
  // three/webgpu alone is ~1.6 MB and loads lazily, after the HTML: the default 500 kB warning is noise.
  build: { chunkSizeWarningLimit: 1700 },
  // Listen on the local network too, to test from a phone; `preview` inherits it.
  server: { host: true },
})
