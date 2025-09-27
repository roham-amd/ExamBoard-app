import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/src': path.resolve(__dirname, './src'),
      '@/': path.resolve(__dirname, './'),
      '@/test': path.resolve(__dirname, './test')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: true,
    coverage: {
      enabled: true,
      reporter: ['text', 'html'],
      reportsDirectory: './coverage/unit'
    }
  }
})
