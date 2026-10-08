import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'

globalThis.DELCOM_BASEURL = 'https://open-api.delcom.org/api/v1'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Editor & viewer Toast UI tidak dijalankan di jsdom; ganti dengan tiruan ringan.
vi.mock('@toast-ui/editor', () => ({
  default: vi.fn(function (options) {
    this.options = options
    this.getMarkdown = () => 'isi markdown'
    this.destroy = vi.fn()
  }),
}))
vi.mock('@toast-ui/editor/dist/toastui-editor-viewer', () => ({
  default: vi.fn(function (options) {
    this.options = options
    this.setMarkdown = vi.fn()
  }),
}))
