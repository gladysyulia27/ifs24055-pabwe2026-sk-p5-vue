import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import Editor from '@toast-ui/editor'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import { apiOk, createMockPinia, renderWithProviders } from '../../../test-utils'
import { getAccessToken, putAccessToken } from '../../../helpers/apiHelper'

vi.mock('../../auth/api/authApi')
vi.mock('../../../helpers/toolsHelper', async (orig) => ({ ...(await orig()), showConfirmDialog: vi.fn() }))

import * as authApi from '../../auth/api/authApi'
import { showConfirmDialog } from '../../../helpers/toolsHelper'
import NavbarComponent from './NavbarComponent.vue'
import SidebarComponent from './SidebarComponent.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import MarkdownViewer from './MarkdownViewer.vue'

beforeEach(() => vi.clearAllMocks())

describe('NavbarComponent', () => {
  it('menampilkan identitas akun dan memicu toggle sidebar', async () => {
    const { emitted } = await renderWithProviders(NavbarComponent, {
      state: { users: { profile: { id: 1, name: 'Ani', photo: 'img/a.png' } } },
    })
    expect(screen.getByText('Ani')).toBeInTheDocument()
    expect(screen.getByAltText('Avatar')).toHaveAttribute('src', expect.stringContaining('img/a.png'))
    await fireEvent.click(screen.getByLabelText('Buka menu'))
    expect(emitted()['toggle-sidebar']).toHaveLength(1)
  })

  it('menampilkan placeholder saat profil belum ada', async () => {
    await renderWithProviders(NavbarComponent)
    expect(screen.getByText('Memuat...')).toBeInTheDocument()
    expect(screen.queryByAltText('Avatar')).not.toBeInTheDocument()
  })

  it('logout dibatalkan', async () => {
    showConfirmDialog.mockResolvedValue(false)
    await renderWithProviders(NavbarComponent)
    await fireEvent.click(screen.getByRole('button', { name: /Logout/ }))
    expect(authApi.logoutApi).not.toHaveBeenCalled()
  })

  it('logout dikonfirmasi menghapus token dan menuju login', async () => {
    putAccessToken('tok')
    showConfirmDialog.mockResolvedValue(true)
    authApi.logoutApi.mockResolvedValue(apiOk({}, 'Berhasil logout'))
    const { router } = await renderWithProviders(NavbarComponent, { route: '/profile' })
    await router.isReady()
    await fireEvent.click(screen.getByRole('button', { name: /Logout/ }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/auth/login'))
    expect(getAccessToken()).toBeNull()
  })
})

describe('SidebarComponent', () => {
  it('menampilkan menu navigasi dan menutup drawer', async () => {
    const { emitted } = await renderWithProviders(SidebarComponent, { props: { open: true } })
    for (const label of ['Dashboard Lelang', 'Lelang Saya', 'Daftar Pengguna', 'Profil Saya'])
      expect(screen.getByText(label)).toBeInTheDocument()
    await fireEvent.click(screen.getByTestId('backdrop'))
    await fireEvent.click(screen.getByText('Profil Saya'))
    expect(emitted().close).toHaveLength(2)
  })

  it('drawer tertutup secara default', async () => {
    await renderWithProviders(SidebarComponent)
    expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveClass('-translate-x-full')
  })
})

describe('MarkdownEditor', () => {
  it('membuat editor, meneruskan perubahan, dan menghancurkannya', async () => {
    createMockPinia()
    const { emitted, unmount } = render(MarkdownEditor, { props: { modelValue: 'awal' } })
    await waitFor(() => expect(Editor.mock.instances.length).toBeGreaterThan(0))
    const instance = Editor.mock.instances.at(-1)
    expect(instance.options.initialValue).toBe('awal')
    instance.options.events.change()
    expect(emitted()['update:modelValue'][0]).toEqual(['isi markdown'])
    unmount()
    expect(instance.destroy).toHaveBeenCalled()
  })

  it('nilai awal default kosong', async () => {
    render(MarkdownEditor)
    await waitFor(() => expect(Editor.mock.instances.length).toBeGreaterThan(0))
    expect(Editor.mock.instances.at(-1).options.initialValue).toBe('')
  })
})

describe('MarkdownViewer', () => {
  it('merender konten dan memperbarui saat berubah', async () => {
    const { rerender } = render(MarkdownViewer, { props: { content: '# Hai' } })
    await waitFor(() => expect(Viewer.mock.instances.length).toBeGreaterThan(0))
    const viewer = Viewer.mock.instances.at(-1)
    expect(viewer.options.initialValue).toBe('# Hai')
    await rerender({ content: 'baru' })
    expect(viewer.setMarkdown).toHaveBeenCalledWith('baru')
  })

  it('konten default kosong', async () => {
    render(MarkdownViewer)
    await waitFor(() => expect(Viewer.mock.instances.length).toBeGreaterThan(0))
    expect(Viewer.mock.instances.at(-1).options.initialValue).toBe('')
  })
})
