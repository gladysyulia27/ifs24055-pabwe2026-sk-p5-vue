import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseUrl = env.VITE_DELCOM_BASEURL || 'https://open-api.delcom.org/api/v1'

  return {
    build: {
      sourcemap: true,
      target: 'esnext',
      assetsInlineLimit: 100000,
    },
    plugins: [vue(), tailwindcss()],
    server: { port: Number(env.APP_PORT) || 5173 },
    preview: { port: Number(env.APP_PORT) || 5173 },
    define: {
      DELCOM_BASEURL: JSON.stringify(baseUrl),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      css: false,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,vue}'],
        exclude: ['src/main.js', 'src/setupTests.js', 'src/test-utils.js', 'src/**/*.test.js'],
        reporter: ['text', 'html'],
        thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  }
})
