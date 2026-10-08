import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../helpers/apiHelper', () => ({ apiFetch: vi.fn().mockResolvedValue({ status: 'success' }) }))

import { apiFetch } from '../helpers/apiHelper'
import { loginApi, logoutApi, registerApi } from './auth/api/authApi'
import {
  changePasswordApi, changePhotoApi, getProfileApi, getUserApi, getUsersApi, updateProfileApi,
} from './users/api/userApi'
import {
  addAucationApi, addBidApi, changeCoverApi, deleteAllAucationsApi, deleteAucationApi, deleteBidApi,
  getAucationApi, getAucationsApi, updateAucationApi,
} from './aucations/api/aucationApi'

beforeEach(() => apiFetch.mockClear())

describe('authApi', () => {
  it('endpoint login, register, logout', async () => {
    await loginApi({ email: 'e', password: 'p', extra: 1 })
    await registerApi({ name: 'n', email: 'e', password: 'p' })
    await logoutApi()
    expect(apiFetch.mock.calls).toEqual([
      ['/auth/login', { method: 'POST', body: { email: 'e', password: 'p' } }],
      ['/auth/register', { method: 'POST', body: { name: 'n', email: 'e', password: 'p' } }],
      ['/auth/logout', { method: 'POST' }],
    ])
  })
})

describe('userApi', () => {
  it('endpoint users & profil', async () => {
    await getUsersApi()
    await getUserApi(4)
    await getProfileApi()
    await updateProfileApi({ name: 'n', email: 'e', x: 1 })
    await changePasswordApi({ password: 'a', new_password: 'b', new_password_confirmation: 'b' })
    expect(apiFetch.mock.calls).toEqual([
      ['/users'],
      ['/users/4'],
      ['/users/me'],
      ['/users/me', { method: 'PUT', body: { name: 'n', email: 'e' } }],
      ['/users/password', { method: 'PUT', body: { password: 'a', new_password: 'b', new_password_confirmation: 'b' } }],
    ])
  })

  it('changePhotoApi mengirim FormData field "photo"', async () => {
    const file = new File(['x'], 'p.png', { type: 'image/png' })
    await changePhotoApi(file)
    const [path, opts] = apiFetch.mock.calls[0]
    expect(path).toBe('/users/me/photo')
    expect(opts.method).toBe('POST')
    expect(opts.formData.get('photo')).toBeInstanceOf(File)
  })
})

describe('aucationApi', () => {
  const payload = { title: 't', description: 'd', start_bid: 1, closed_at: 'c', junk: true }
  const body = { title: 't', description: 'd', start_bid: 1, closed_at: 'c' }

  it('endpoint CRUD, bid, dan hapus semua', async () => {
    await getAucationsApi()
    await getAucationsApi({ is_me: 1 })
    await getAucationApi(2)
    await addAucationApi(payload)
    await updateAucationApi(2, payload)
    await deleteAucationApi(2)
    await addBidApi(2, 500)
    await deleteBidApi(2)
    await deleteAllAucationsApi()
    expect(apiFetch.mock.calls).toEqual([
      ['/aucations', { params: {} }],
      ['/aucations', { params: { is_me: 1 } }],
      ['/aucations/2'],
      ['/aucations', { method: 'POST', body }],
      ['/aucations/2', { method: 'PUT', body }],
      ['/aucations/2', { method: 'DELETE' }],
      ['/aucations/2/bids', { method: 'POST', body: { bid: 500 } }],
      ['/aucations/2/bids', { method: 'DELETE' }],
      ['/aucations', { method: 'DELETE' }],
    ])
  })

  it('changeCoverApi mengirim FormData field "cover"', async () => {
    await changeCoverApi(2, new File(['x'], 'c.png'))
    const [path, opts] = apiFetch.mock.calls[0]
    expect(path).toBe('/aucations/2/cover')
    expect(opts.formData.get('cover')).toBeInstanceOf(File)
  })
})
