import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { apiOk, MarkdownEditorStub, renderWithProviders } from '../../../../test-utils'

vi.mock('../../api/aucationApi')
vi.mock('../../../../helpers/toolsHelper', async (orig) => ({
  ...(await orig()),
  showSuccessDialog: vi.fn().mockResolvedValue(),
  showErrorDialog: vi.fn().mockResolvedValue(),
}))

import * as api from '../../api/aucationApi'
import { showErrorDialog, showSuccessDialog } from '../../../../helpers/toolsHelper'
import AddModal from './AddModal.vue'
import ChangeModal from './ChangeModal.vue'
import ChangeCoverModal from './ChangeCoverModal.vue'
import BidModal from './BidModal.vue'

const global = { stubs: { MarkdownEditor: MarkdownEditorStub } }
const render = (c, props = {}) => renderWithProviders(c, { props, global })

beforeEach(() => vi.clearAllMocks())

describe('AddModal', () => {
  const fillForm = async () => {
    await fireEvent.update(screen.getByLabelText('Judul'), 'Laptop')
    await fireEvent.update(screen.getByTestId('md'), '**bagus**')
    await fireEvent.update(screen.getByLabelText('Harga Awal (Rp)'), '1000')
    await fireEvent.update(screen.getByLabelText('Ditutup Pada'), '2026-12-31T23:59')
  }

  it('tertutup tidak merender apa pun', async () => {
    await render(AddModal)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('validasi semua field', async () => {
    await render(AddModal, { open: true })
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    for (const t of ['Judul wajib diisi', 'Deskripsi wajib diisi', 'Harga awal harus lebih dari 0', 'Batas waktu wajib diisi'])
      expect(screen.getByText(t)).toBeInTheDocument()
    expect(api.addAucationApi).not.toHaveBeenCalled()
  })

  it('submit sukses mengirim payload, mengosongkan form, dan emit done+close', async () => {
    api.addAucationApi.mockResolvedValue(apiOk({}, 'Berhasil menambah'))
    const { emitted } = await render(AddModal, { open: true })
    await fillForm()
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await waitFor(() => expect(emitted().done).toHaveLength(1))
    expect(api.addAucationApi).toHaveBeenCalledWith({
      title: 'Laptop', description: '**bagus**', start_bid: 1000, closed_at: '2026-12-31 23:59:00',
    })
    expect(showSuccessDialog).toHaveBeenCalledWith('Berhasil menambah')
    expect(emitted().close).toHaveLength(1)
    expect(screen.getByLabelText('Judul')).toHaveValue('')
  })

  it('galat API menampilkan dialog dan tidak menutup modal', async () => {
    api.addAucationApi.mockRejectedValue(new Error('Data tidak valid'))
    const { emitted } = await render(AddModal, { open: true })
    await fillForm()
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Data tidak valid'))
    expect(emitted().close).toBeUndefined()
  })

  it('tombol batal & status menyimpan', async () => {
    api.addAucationApi.mockReturnValue(new Promise(() => {}))
    const { emitted } = await render(AddModal, { open: true })
    await fillForm()
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    await fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(emitted().close).toHaveLength(1)
  })
})

describe('ChangeModal', () => {
  const aucation = { id: 7, title: 'Lama', description: 'desk', start_bid: 500, closed_at: '2026-12-31 20:00:00' }

  it('tertutup dan tanpa data', async () => {
    await render(ChangeModal)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('terisi dari data lelang dan validasi bila dikosongkan', async () => {
    await render(ChangeModal, { open: true, aucation })
    expect(screen.getByLabelText('Judul')).toHaveValue('Lama')
    expect(screen.getByLabelText('Ditutup Pada')).toHaveValue('2026-12-31T20:00')
    await fireEvent.update(screen.getByLabelText('Judul'), ' ')
    await fireEvent.update(screen.getByTestId('md'), ' ')
    await fireEvent.update(screen.getByLabelText('Harga Awal (Rp)'), '0')
    await fireEvent.update(screen.getByLabelText('Ditutup Pada'), '')
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument()
    expect(screen.getByText('Deskripsi wajib diisi')).toBeInTheDocument()
    expect(screen.getByText('Harga awal harus lebih dari 0')).toBeInTheDocument()
    expect(screen.getByText('Batas waktu wajib diisi')).toBeInTheDocument()
  })

  it('submit sukses dan gagal', async () => {
    api.updateAucationApi.mockResolvedValueOnce(apiOk({}, 'Berhasil mengubah data'))
    const { emitted } = await render(ChangeModal, { open: true, aucation })
    await fireEvent.update(screen.getByLabelText('Judul'), 'Baru')
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(emitted().done).toHaveLength(1))
    expect(api.updateAucationApi).toHaveBeenCalledWith(7, {
      title: 'Baru', description: 'desk', start_bid: 500, closed_at: '2026-12-31 20:00:00',
    })

    api.updateAucationApi.mockRejectedValueOnce(new Error('Gagal ubah'))
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Gagal ubah'))
    await fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(emitted().close).toHaveLength(2)
  })

  it('status menyimpan', async () => {
    api.updateAucationApi.mockReturnValue(new Promise(() => {}))
    await render(ChangeModal, { open: true, aucation })
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
  })

  it('field kosong bila lelang null', async () => {
    await render(ChangeModal, { open: true, aucation: null })
    expect(screen.getByLabelText('Judul')).toHaveValue('')
  })
})

describe('ChangeCoverModal', () => {
  const file = new File(['x'], 'c.png', { type: 'image/png' })

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('tertutup', async () => {
    await render(ChangeCoverModal)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('meminta memilih gambar jika kosong', async () => {
    await render(ChangeCoverModal, { open: true, aucationId: 3 })
    await fireEvent.click(screen.getByRole('button', { name: 'Unggah' }))
    expect(screen.getByText('Pilih gambar terlebih dahulu')).toBeInTheDocument()
  })

  it('pratinjau live, ganti file, batal pilih, lalu unggah sukses', async () => {
    api.changeCoverApi.mockResolvedValue(apiOk({}, 'Berhasil mengubah cover'))
    const { emitted, unmount } = await render(ChangeCoverModal, { open: true, aucationId: 3 })
    const input = screen.getByTestId('cover-input')

    await fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByAltText('Pratinjau cover')).toHaveAttribute('src', 'blob:preview')
    await fireEvent.change(input, { target: { files: [file] } })
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    await fireEvent.change(input, { target: { files: [] } })
    expect(screen.queryByAltText('Pratinjau cover')).not.toBeInTheDocument()

    await fireEvent.change(input, { target: { files: [file] } })
    await fireEvent.click(screen.getByRole('button', { name: 'Unggah' }))
    await waitFor(() => expect(emitted().done).toHaveLength(1))
    expect(api.changeCoverApi).toHaveBeenCalledWith(3, file)
    expect(showSuccessDialog).toHaveBeenCalledWith('Berhasil mengubah cover')
    unmount()
  })

  it('galat unggah, batal, dan status mengunggah', async () => {
    api.changeCoverApi.mockRejectedValueOnce(new Error('Gagal unggah'))
    const { emitted } = await render(ChangeCoverModal, { open: true, aucationId: 3 })
    await fireEvent.change(screen.getByTestId('cover-input'), { target: { files: [file] } })
    await fireEvent.click(screen.getByRole('button', { name: 'Unggah' }))
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Gagal unggah'))
    await fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(emitted().close).toHaveLength(1)

    api.changeCoverApi.mockReturnValue(new Promise(() => {}))
    await fireEvent.click(screen.getByRole('button', { name: 'Unggah' }))
    expect(await screen.findByRole('button', { name: 'Mengunggah...' })).toBeDisabled()
  })
})

describe('BidModal', () => {
  const base = { id: 5, start_bid: 1000 }
  const withBids = { ...base, bids: [{ id: 1, bid: 2000 }] }
  const submit = async (value) => {
    await fireEvent.update(screen.getByLabelText('Nominal Tawaran (Rp)'), String(value))
    await fireEvent.click(screen.getByRole('button', { name: 'Kirim Tawaran' }))
  }

  it('tertutup', async () => {
    await render(BidModal)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('tanpa bid: minimal harga awal', async () => {
    await render(BidModal, { open: true, aucation: { ...base, bids: [] } })
    expect(screen.getByText(/Harga awal/)).toBeInTheDocument()
    await submit(500)
    expect(screen.getByText(/Tawaran minimal/)).toBeInTheDocument()
    expect(api.addBidApi).not.toHaveBeenCalled()
  })

  it('ada bid: harus lebih tinggi dari tertinggi', async () => {
    await render(BidModal, { open: true, aucation: withBids })
    expect(screen.getByText(/Tawaran tertinggi/)).toBeInTheDocument()
    await submit(2000)
    expect(screen.getByText(/harus lebih tinggi dari/)).toBeInTheDocument()
    expect(api.addBidApi).not.toHaveBeenCalled()
  })

  it('sukses, gagal, batal, dan status mengirim', async () => {
    api.addBidApi.mockResolvedValueOnce(apiOk({}, 'Berhasil memberikan tawaran'))
    const { emitted } = await render(BidModal, { open: true, aucation: withBids })
    await submit(3000)
    await waitFor(() => expect(emitted().done).toHaveLength(1))
    expect(api.addBidApi).toHaveBeenCalledWith(5, 3000)
    expect(screen.getByLabelText('Nominal Tawaran (Rp)')).toHaveValue(null)

    api.addBidApi.mockRejectedValueOnce(new Error('Gagal menawar'))
    await submit(4000)
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Gagal menawar'))
    await fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(emitted().close).toHaveLength(2)

    api.addBidApi.mockReturnValue(new Promise(() => {}))
    await submit(5000)
    expect(await screen.findByRole('button', { name: 'Mengirim...' })).toBeDisabled()
  })
})
