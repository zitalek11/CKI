import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { moexAuthPlugin } from './server/moexAuthPlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      moexAuthPlugin({
        user: env.MOEX_USER || env.VITE_MOEX_USER,
        password: env.MOEX_PASSWORD || env.VITE_MOEX_PASSWORD,
      }),
    ],
  }
})
