import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/NutsAndBolts/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.*', 'tests/**/*.spec.*'],
    exclude: ['e2e/**'],
    coverage: {
      exclude: ['src/assets/icons/**']
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0')
  }
})
