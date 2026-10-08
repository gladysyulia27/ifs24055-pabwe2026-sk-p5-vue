import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { apiOk, MarkdownEditorStub, renderWithProviders } from '../../test-utils'
import { putAccessToken } from '../../helpers/apiHelper'
import App from '../../App.vue'

vi.mock('./api/aucationApi')
vi.mock('../users/api/userApi')
vi.mock('../auth/api/authApi')
vi.mock('../../helpers/toolsHelper', async (orig) => ({
  ...(await orig()),
  showSuccessDialog: vi.fn().mockResolvedValue(),
  showErrorDialog: vi.fn().mockResolvedValue(),
  showConfirmDialog: vi.fn(),
}))

import * as api from './api/aucationApi'
import * as userApi from '../users/api/userApi'
import { showConfirmDialog, showErrorDialog, showSuccessDialog } from '../../helpers/toolsHelper'

const global = { stubs: { MarkdownEditor: MarkdownEditorStub } }
const open = (route) => renderWithProviders(App, { route, global })
const future = '2099-12-31 23:59:00'
const past = '2020-01-01 00:00:00'

const mine = {
  id: 1, user_id: 1, title: 'Laptop Gaming', description: 'spek tinggi', start_bid: 5000000, closed_at: future,
  cover: 'http://x.test/c.png', author: { name: 'Ani' }, bids: [{ id: 1, bid: 7000000 }],
}
const theirs = {
  id: 2, user_id: 9, title: 'Sepeda Lipat', description: 'masih mulus', start_bid: 1000000, closed_at: past,
  cover: null, author: { name: 'Budi' }, bids: [3, 4],
}

beforeEach(() => {
  vi.clearAllMocks()
  putAccessToken('tok')
  userApi.getProfileApi.mockResolvedValue(apiOk({ user: { id: 1, name: 'Ani', email: 'a@b.co', photo: 'img/a.png' } }))
  api.getAucationsApi.mockResolvedValue(apiOk({ aucations: [mine, theirs] }))
})

describe('AucationLayout', () => {
  it('memuat profil dan membuka/menutup sidebar', async () => {
    await open('/')
    expect(await screen.findByText('Ani')).toBeInTheDocument()
    const aside = screen.getByRole('complementary')
    await fireEvent.click(screen.getByLabelText('Buka menu'))
    expect(aside).toHaveClass('translate-x-0')
    await fireEvent.click(screen.getByTestId('backdrop'))
    expect(aside).toHaveClass('-translate-x-full')
  })

  it('401 mengarahkan ke login dan menghapus sesi', async () => {
    userApi.getProfileApi.mockRejectedValue(Object.assign(new Error('Unauthenticated.'), { statusCode: 401 }))
    const { router } = await open('/')
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/auth/login'))
    expect(localStorage.length).toBe(0)
  })

  it('galat non-401 tetap di halaman', async () => {
    userApi.getProfileApi.mockRejectedValue(Object.assign(new Error('Server error'), { statusCode: 500 }))
    const { router } = await open('/')
    await screen.findByText('Laptop Gaming')
    expect(router.currentRoute.value.path).toBe('/')
  })
})

describe('HomePage', () => {
  it('menampilkan kartu lelang beserta info bid dan status', async () => {
    await open('/')
    const cards = await screen.findAllByTestId('aucation-card')
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByText(/Tertinggi/)).toBeInTheDocument()
    expect(within(cards[0]).getByAltText('Laptop Gaming')).toBeInTheDocument()
    expect(within(cards[1]).getByText('2 penawaran')).toBeInTheDocument()
    expect(within(cards[1]).getByText('Ditutup')).toBeInTheDocument()
    expect(api.getAucationsApi).toHaveBeenCalledWith({})
    // tombol ubah/hapus hanya untuk pemilik
    await waitFor(() => expect(within(cards[0]).getByLabelText('Ubah')).toBeInTheDocument())
    expect(within(cards[1]).queryByLabelText('Ubah')).not.toBeInTheDocument()
  })

  it('live search & keadaan kosong', async () => {
    await open('/')
    await screen.findAllByTestId('aucation-card')
    const search = screen.getByPlaceholderText('Cari judul atau deskripsi...')
    await fireEvent.update(search, 'mulus')
    expect(screen.getAllByTestId('aucation-card')).toHaveLength(1)
    await fireEvent.update(search, 'laptop')
    expect(screen.getByText('Laptop Gaming')).toBeInTheDocument()
    await fireEvent.update(search, 'tidak ada')
    expect(screen.getByText('Belum ada lelang.')).toBeInTheDocument()
  })

  it('status memuat', async () => {
    api.getAucationsApi.mockReturnValue(new Promise(() => {}))
    await open('/')
    expect(await screen.findByText('Memuat lelang...')).toBeInTheDocument()
  })

  it('tab memakai parameter filter yang sesuai', async () => {
    const { router } = await open('/')
    await screen.findAllByTestId('aucation-card')
    for (const [label, key, params] of [
      ['Lelang Saya', 'mine', { is_me: 1 }],
      ['Lelang Berlangsung', 'open', { is_closed: 1 }],
      ['Lelang Ditutup', 'closed', { is_closed: 0 }],
    ]) {
      await fireEvent.click(screen.getByRole('button', { name: label }))
      await waitFor(() => expect(api.getAucationsApi).toHaveBeenLastCalledWith(params))
      expect(router.currentRoute.value.query.tab).toBe(key)
    }
    await fireEvent.click(screen.getByRole('button', { name: 'Semua Lelang' }))
    await waitFor(() => expect(api.getAucationsApi).toHaveBeenLastCalledWith({}))
    expect(router.currentRoute.value.query.tab).toBeUndefined()
  })

  it('tab tidak dikenal kembali ke semua lelang', async () => {
    await open('/?tab=ngawur')
    await screen.findAllByTestId('aucation-card')
    expect(api.getAucationsApi).toHaveBeenCalledWith({})
  })

  it('hapus lelang: batal, sukses, gagal', async () => {
    await open('/')
    const card = (await screen.findAllByTestId('aucation-card'))[0]
    const del = await within(card).findByLabelText('Hapus')

    showConfirmDialog.mockResolvedValueOnce(false)
    await fireEvent.click(del)
    expect(api.deleteAucationApi).not.toHaveBeenCalled()

    showConfirmDialog.mockResolvedValueOnce(true)
    api.deleteAucationApi.mockResolvedValueOnce(apiOk({}, 'Berhasil menghapus data'))
    await fireEvent.click(del)
    await waitFor(() => expect(showSuccessDialog).toHaveBeenCalledWith('Berhasil menghapus data'))
    expect(api.deleteAucationApi).toHaveBeenCalledWith(1)
    await waitFor(() => expect(api.getAucationsApi).toHaveBeenCalledTimes(2))

    showConfirmDialog.mockResolvedValueOnce(true)
    api.deleteAucationApi.mockRejectedValueOnce(new Error('Gagal hapus'))
    await fireEvent.click(del)
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Gagal hapus'))
  })

  it('hapus semua lelang milik saya: batal, sukses, gagal', async () => {
    await open('/?tab=mine')
    const btn = await screen.findByRole('button', { name: /Hapus Semua/ })

    showConfirmDialog.mockResolvedValueOnce(false)
    await fireEvent.click(btn)
    expect(api.deleteAllAucationsApi).not.toHaveBeenCalled()

    showConfirmDialog.mockResolvedValueOnce(true)
    api.deleteAllAucationsApi.mockResolvedValueOnce(apiOk({}, 'Semua terhapus'))
    await fireEvent.click(btn)
    await waitFor(() => expect(showSuccessDialog).toHaveBeenCalledWith('Semua terhapus'))

    showConfirmDialog.mockResolvedValueOnce(true)
    api.deleteAllAucationsApi.mockRejectedValueOnce(new Error('Gagal semua'))
    await fireEvent.click(btn)
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Gagal semua'))
  })

  it('tombol Hapus Semua tidak muncul di tab lain', async () => {
    await open('/')
    await screen.findAllByTestId('aucation-card')
    expect(screen.queryByRole('button', { name: /Hapus Semua/ })).not.toBeInTheDocument()
  })

  it('menambah lelang lewat modal lalu memuat ulang daftar', async () => {
    api.addAucationApi.mockResolvedValue(apiOk({}, 'Ditambahkan'))
    await open('/')
    await screen.findAllByTestId('aucation-card')
    await fireEvent.click(screen.getByRole('button', { name: /Tambah Lelang/ }))
    await fireEvent.update(screen.getByLabelText('Judul'), 'Baru')
    await fireEvent.update(screen.getByTestId('md'), 'desk')
    await fireEvent.update(screen.getByLabelText('Harga Awal (Rp)'), '100')
    await fireEvent.update(screen.getByLabelText('Ditutup Pada'), '2099-01-01T10:00')
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await waitFor(() => expect(api.getAucationsApi).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('mengubah lelang milik sendiri lewat modal', async () => {
    api.updateAucationApi.mockResolvedValue(apiOk({}, 'Diubah'))
    await open('/')
    const card = (await screen.findAllByTestId('aucation-card'))[0]
    await fireEvent.click(await within(card).findByLabelText('Ubah'))
    expect(screen.getByLabelText('Judul')).toHaveValue('Laptop Gaming')
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(api.updateAucationApi).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Laptop Gaming' })))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('DetailPage', () => {
  const detail = (over = {}) =>
    api.getAucationApi.mockResolvedValue(apiOk({ aucation: { ...mine, user_id: 9, my_bid: null, ...over } }))

  it('menampilkan detail, deskripsi markdown, dan riwayat bid', async () => {
    detail({ my_bid: { id: 1, bid: 7000000 } })
    await open('/aucations/1')
    expect(await screen.findByRole('heading', { name: 'Laptop Gaming' })).toBeInTheDocument()
    expect(screen.getByTestId('md-viewer')).toBeInTheDocument()
    expect(screen.getByText('Riwayat Penawaran')).toBeInTheDocument()
    expect(screen.getByText(/Tawaran Anda/)).toBeInTheDocument()
    expect(api.getAucationApi).toHaveBeenCalledWith('1')
  })

  it('tanpa cover dan tanpa bid', async () => {
    detail({ cover: null, bids: [] })
    await open('/aucations/1')
    expect(await screen.findByText('Belum ada penawaran.')).toBeInTheDocument()
    expect(screen.queryByAltText('Laptop Gaming')).not.toBeInTheDocument()
    expect(screen.queryByText(/Tertinggi/)).not.toBeInTheDocument()
  })

  it('status memuat dan galat muat', async () => {
    api.getAucationApi.mockReturnValueOnce(new Promise(() => {}))
    await open('/aucations/1')
    expect(await screen.findByText('Memuat detail lelang...')).toBeInTheDocument()
  })

  it('galat saat memuat menampilkan pesan', async () => {
    api.getAucationApi.mockRejectedValue(new Error('Lelang tidak ditemukan'))
    await open('/aucations/99')
    expect(await screen.findByText('Lelang tidak ditemukan')).toBeInTheDocument()
  })

  it('peserta: ajukan bid lalu batalkan bid', async () => {
    detail({ my_bid: { id: 1, bid: 7000000 } })
    api.addBidApi.mockResolvedValue(apiOk({}, 'Bid dikirim'))
    await open('/aucations/1')
    await fireEvent.click(await screen.findByRole('button', { name: 'Ajukan Tawaran' }))
    await fireEvent.update(screen.getByLabelText('Nominal Tawaran (Rp)'), '8000000')
    await fireEvent.click(screen.getByRole('button', { name: 'Kirim Tawaran' }))
    await waitFor(() => expect(api.addBidApi).toHaveBeenCalledWith(1, 8000000))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const cancel = screen.getByRole('button', { name: 'Batalkan Tawaran' })
    showConfirmDialog.mockResolvedValueOnce(false)
    await fireEvent.click(cancel)
    expect(api.deleteBidApi).not.toHaveBeenCalled()

    showConfirmDialog.mockResolvedValueOnce(true)
    api.deleteBidApi.mockResolvedValueOnce(apiOk({}, 'Bid dibatalkan'))
    await fireEvent.click(cancel)
    await waitFor(() => expect(showSuccessDialog).toHaveBeenCalledWith('Bid dibatalkan'))

    showConfirmDialog.mockResolvedValueOnce(true)
    api.deleteBidApi.mockRejectedValueOnce(new Error('Gagal batal'))
    await fireEvent.click(cancel)
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Gagal batal'))
  })

  it('peserta tanpa bid sebelumnya tidak melihat tombol batal', async () => {
    detail()
    await open('/aucations/1')
    await screen.findByRole('button', { name: 'Ajukan Tawaran' })
    expect(screen.queryByRole('button', { name: 'Batalkan Tawaran' })).not.toBeInTheDocument()
  })

  it('lelang ditutup: non-pemilik tidak bisa menawar', async () => {
    detail({ closed_at: past })
    await open('/aucations/1')
    await screen.findByRole('heading', { name: 'Laptop Gaming' })
    expect(screen.queryByRole('button', { name: 'Ajukan Tawaran' })).not.toBeInTheDocument()
  })

  it('pemilik: ubah, ganti cover, dan hapus lelang', async () => {
    detail({ user_id: 1 })
    api.updateAucationApi.mockResolvedValue(apiOk({}, 'Diubah'))
    api.changeCoverApi.mockResolvedValue(apiOk({}, 'Cover diubah'))
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const { router } = await open('/aucations/1')
    await screen.findByRole('button', { name: 'Hapus Lelang' })
    expect(screen.queryByRole('button', { name: 'Ajukan Tawaran' })).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Ubah Lelang' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(api.updateAucationApi).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await fireEvent.click(screen.getByRole('button', { name: 'Ganti Cover' }))
    await fireEvent.change(screen.getByTestId('cover-input'), { target: { files: [new File(['x'], 'c.png')] } })
    await fireEvent.click(screen.getByRole('button', { name: 'Unggah' }))
    await waitFor(() => expect(api.changeCoverApi).toHaveBeenCalledWith(1, expect.any(File)))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const del = screen.getByRole('button', { name: 'Hapus Lelang' })
    showConfirmDialog.mockResolvedValueOnce(false)
    await fireEvent.click(del)
    expect(api.deleteAucationApi).not.toHaveBeenCalled()

    showConfirmDialog.mockResolvedValueOnce(true)
    api.deleteAucationApi.mockResolvedValueOnce(apiOk({}, 'Dihapus'))
    await fireEvent.click(del)
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
  })
})
