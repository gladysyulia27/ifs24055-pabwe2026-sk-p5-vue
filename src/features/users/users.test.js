import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { apiOk, renderWithProviders } from '../../test-utils'

vi.mock('./api/userApi')
vi.mock('../../helpers/toolsHelper', async (orig) => ({
  ...(await orig()),
  showSuccessDialog: vi.fn().mockResolvedValue(),
  showErrorDialog: vi.fn().mockResolvedValue(),
}))

import * as userApi from './api/userApi'
import { showErrorDialog, showSuccessDialog } from '../../helpers/toolsHelper'
import UsersPage from './pages/UsersPage.vue'
import ProfilePage from './pages/ProfilePage.vue'

beforeEach(() => vi.clearAllMocks())

const users = [
  { id: 1, name: 'Ani Lestari', email: 'ani@delcom.org', photo: 'img/a.png', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, name: 'Budi', email: 'budi@delcom.org', photo: 'https://x.test/b.png', created_at: '2026-01-02T00:00:00Z' },
]

describe('UsersPage', () => {
  it('menampilkan, memfilter, dan menangani kosong', async () => {
    userApi.getUsersApi.mockResolvedValue(apiOk({ users }))
    await renderWithProviders(UsersPage, { route: '/users' })
    expect(await screen.findByText('Ani Lestari')).toBeInTheDocument()
    expect(screen.getByText('Budi')).toBeInTheDocument()

    const search = screen.getByPlaceholderText('Cari nama / email...')
    await fireEvent.update(search, 'budi@')
    expect(screen.queryByText('Ani Lestari')).not.toBeInTheDocument()
    await fireEvent.update(search, 'zzz')
    expect(screen.getByText('Pengguna tidak ditemukan.')).toBeInTheDocument()
  })

  it('menampilkan status memuat', async () => {
    userApi.getUsersApi.mockReturnValue(new Promise(() => {}))
    await renderWithProviders(UsersPage, { route: '/users' })
    expect(await screen.findByText('Memuat pengguna...')).toBeInTheDocument()
  })
})

describe('ProfilePage', () => {
  const profile = { id: 1, name: 'Ani', email: 'ani@delcom.org', photo: 'img/a.png' }
  const setup = async () => {
    userApi.getProfileApi.mockResolvedValue(apiOk({ user: profile }))
    await renderWithProviders(ProfilePage, { route: '/profile' })
    await waitFor(() => expect(screen.getByLabelText('Nama')).toHaveValue('Ani'))
  }

  it('mengisi form dari profil dan menyimpan perubahan', async () => {
    await setup()
    expect(screen.getByLabelText('Email')).toHaveValue('ani@delcom.org')
    userApi.updateProfileApi.mockResolvedValue(apiOk({ user: { ...profile, name: 'Ani B' } }, 'Berhasil mengubah data'))
    await fireEvent.update(screen.getByLabelText('Nama'), 'Ani B')
    await fireEvent.update(screen.getByLabelText('Email'), 'ani.b@delcom.org')
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(showSuccessDialog).toHaveBeenCalledWith('Berhasil mengubah data'))
    expect(userApi.updateProfileApi).toHaveBeenCalledWith({ name: 'Ani B', email: 'ani.b@delcom.org' })
  })

  it('galat update profil menampilkan dialog', async () => {
    await setup()
    userApi.updateProfileApi.mockRejectedValue(new Error('Email dipakai'))
    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Email dipakai'))
  })

  it('ganti foto: ada file, tanpa file', async () => {
    await setup()
    userApi.changePhotoApi.mockResolvedValue(apiOk({}, 'Foto diubah'))
    const input = screen.getByTestId('photo-input')
    await fireEvent.change(input, { target: { files: [] } })
    expect(userApi.changePhotoApi).not.toHaveBeenCalled()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(showSuccessDialog).toHaveBeenCalledWith('Foto diubah'))
    expect(userApi.changePhotoApi).toHaveBeenCalledWith(file)
  })

  it('ganti kata sandi sukses mengosongkan form, gagal menampilkan galat', async () => {
    await setup()
    userApi.changePasswordApi.mockResolvedValueOnce(apiOk({}, 'Sandi diubah'))
    await fireEvent.update(screen.getByLabelText('Kata sandi saat ini'), 'lama')
    await fireEvent.update(screen.getByLabelText('Kata sandi baru'), 'baru123')
    await fireEvent.update(screen.getByLabelText('Konfirmasi kata sandi baru'), 'baru123')
    await fireEvent.click(screen.getByRole('button', { name: 'Ubah Kata Sandi' }))
    await waitFor(() => expect(screen.getByLabelText('Kata sandi baru')).toHaveValue(''))
    expect(userApi.changePasswordApi).toHaveBeenCalledWith({
      password: 'lama', new_password: 'baru123', new_password_confirmation: 'baru123',
    })

    userApi.changePasswordApi.mockRejectedValueOnce(new Error('Sandi salah'))
    await fireEvent.update(screen.getByLabelText('Kata sandi saat ini'), 'x')
    await fireEvent.click(screen.getByRole('button', { name: 'Ubah Kata Sandi' }))
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Sandi salah'))
    expect(screen.getByLabelText('Kata sandi saat ini')).toHaveValue('x')
  })

  it('profil kosong saat belum dimuat', async () => {
    userApi.getProfileApi.mockReturnValue(new Promise(() => {}))
    await renderWithProviders(ProfilePage, { route: '/profile' })
    expect(screen.getByLabelText('Nama')).toHaveValue('')
  })

  it('menampilkan status saat menyimpan/mengunggah', async () => {
    await setup()
    const pending = new Promise(() => {})
    userApi.updateProfileApi.mockReturnValue(pending)
    userApi.changePasswordApi.mockReturnValue(pending)
    userApi.changePhotoApi.mockReturnValue(pending)

    await fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Ubah Kata Sandi' }))
    await fireEvent.change(screen.getByTestId('photo-input'), { target: { files: [new File(['x'], 'a.png')] } })

    expect(await screen.findAllByRole('button', { name: 'Menyimpan...' })).toHaveLength(2)
    expect(screen.getByText('Mengunggah...')).toBeInTheDocument()
  })
})
