import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify('test'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    isolate: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'lib',
          environment: 'node',
          include: ['src/lib/**/*.test.ts'],
          exclude: ['src/lib/use*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/lib/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom-hooks',
          environment: 'jsdom',
          include: ['src/lib/use*.test.ts'],
        },
      },
    ],
  },
})
