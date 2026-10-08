import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { apiOk, renderWithProviders } from '../../test-utils'
import { getAccessToken } from '../../helpers/apiHelper'

vi.mock('./api/authApi')
vi.mock('../../helpers/toolsHelper', async (orig) => ({
  ...(await orig()),
  showSuccessDialog: vi.fn().mockResolvedValue(),
  showErrorDialog: vi.fn().mockResolvedValue(),
}))

import * as authApi from './api/authApi'
import { showErrorDialog, showSuccessDialog } from '../../helpers/toolsHelper'
import App from '../../App.vue'
import LoginPage from './pages/LoginPage.vue'
import RegisterPage from './pages/RegisterPage.vue'

beforeEach(() => vi.clearAllMocks())
const type = (label, value) => fireEvent.update(screen.getByLabelText(label), value)

describe('AuthLayout (via App)', () => {
  it('menampilkan banner dan area form', async () => {
    await renderWithProviders(App, { route: '/auth/login' })
    expect(screen.getByText('Delcom Auction')).toBeInTheDocument()
    expect(screen.getByText(/Tawar, menang/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })
})

describe('LoginPage', () => {
  it('validasi form kosong', async () => {
    await renderWithProviders(LoginPage, { route: '/auth/login' })
    await fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(screen.getByText('Email tidak valid')).toBeInTheDocument()
    expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument()
    expect(authApi.loginApi).not.toHaveBeenCalled()
  })

  it('login sukses menyimpan token & menuju beranda', async () => {
    authApi.loginApi.mockResolvedValue(apiOk({ token: 'tok' }, 'Berhasil login'))
    const { router } = await renderWithProviders(LoginPage, { route: '/auth/login' })
    await type('Email', 'a@b.co')
    await type('Kata Sandi', 'rahasia')
    await fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    expect(showSuccessDialog).toHaveBeenCalledWith('Berhasil login')
    expect(getAccessToken()).toBe('tok')
  })

  it('login gagal menampilkan dialog galat', async () => {
    authApi.loginApi.mockRejectedValue(new Error('Kredensial akun tidak ditemukan'))
    await renderWithProviders(LoginPage, { route: '/auth/login' })
    await type('Email', 'a@b.co')
    await type('Kata Sandi', 'x')
    await fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Kredensial akun tidak ditemukan'))
  })

  it('tombol dinonaktifkan saat memproses', async () => {
    authApi.loginApi.mockReturnValue(new Promise(() => {}))
    await renderWithProviders(LoginPage, { route: '/auth/login' })
    await type('Email', 'a@b.co')
    await type('Kata Sandi', 'x')
    await fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('button', { name: 'Memproses...' })).toBeDisabled()
  })
})

describe('RegisterPage', () => {
  const fill = async (v) => {
    await type('Nama Lengkap', v.name)
    await type('Email', v.email)
    await type('Kata Sandi', v.password)
    await type('Konfirmasi Kata Sandi', v.confirm)
    await fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))
  }

  it('validasi semua field', async () => {
    await renderWithProviders(RegisterPage, { route: '/auth/register' })
    await fill({ name: ' ', email: 'x', password: '123', confirm: '456' })
    expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument()
    expect(screen.getByText('Email tidak valid')).toBeInTheDocument()
    expect(screen.getByText('Kata sandi minimal 6 karakter')).toBeInTheDocument()
    expect(screen.getByText('Konfirmasi kata sandi tidak sama')).toBeInTheDocument()
  })

  it('registrasi sukses menuju login', async () => {
    authApi.registerApi.mockResolvedValue(apiOk({}, 'Berhasil melakukan pendaftaran'))
    const { router } = await renderWithProviders(RegisterPage, { route: '/auth/register' })
    await fill({ name: 'Ani', email: 'a@b.co', password: '123456', confirm: '123456' })
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/auth/login'))
    expect(authApi.registerApi).toHaveBeenCalledWith({ name: 'Ani', email: 'a@b.co', password: '123456' })
  })

  it('registrasi gagal menampilkan dialog galat', async () => {
    authApi.registerApi.mockRejectedValue(new Error('Email sudah dipakai'))
    await renderWithProviders(RegisterPage, { route: '/auth/register' })
    await fill({ name: 'Ani', email: 'a@b.co', password: '123456', confirm: '123456' })
    await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith('Email sudah dipakai'))
  })

  it('menampilkan status memproses', async () => {
    authApi.registerApi.mockReturnValue(new Promise(() => {}))
    await renderWithProviders(RegisterPage, { route: '/auth/register' })
    await fill({ name: 'Ani', email: 'a@b.co', password: '123456', confirm: '123456' })
    expect(await screen.findByRole('button', { name: 'Memproses...' })).toBeDisabled()
  })
})
