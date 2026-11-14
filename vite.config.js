import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite is the tool that runs the app while you develop ("npm run dev")
// and bundles it for the internet when you deploy ("npm run build").
export default defineConfig({
  plugins: [react()],
})
