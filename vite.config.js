import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/speedtesttypingproject/',  // ← GitHub Pages path fix
  plugins: [react()],
})