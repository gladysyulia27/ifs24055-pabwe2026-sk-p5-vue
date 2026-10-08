import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Converts render-blocking <link rel="stylesheet"> → async preload without touching JS bundles.
// This preserves Vite source maps (no post-processing of JS) while eliminating the CSS render-block.
function preloadCssPlugin() {
  return {
    name: 'preload-css',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        (_, href) =>
          `<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" href="${href}">` +
          `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseUrl = env.VITE_DELCOM_BASEURL || 'https://open-api.delcom.org/api/v1'

  return {
    build: {
      sourcemap: true,
      target: 'esnext',
      rolldownOptions: {
        output: {
          codeSplitting: true,
        },
      },
    },
    plugins: [vue(), tailwindcss(), preloadCssPlugin()],
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
        reporter: ['text', 'html', 'lcov'],
        thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  }
})
