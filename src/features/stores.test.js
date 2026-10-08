import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockPinia, apiOk } from '../test-utils'
import { getAccessToken, putAccessToken } from '../helpers/apiHelper'

vi.mock('./auth/api/authApi')
vi.mock('./users/api/userApi')
vi.mock('./aucations/api/aucationApi')

import * as authApi from './auth/api/authApi'
import * as userApi from './users/api/userApi'
import * as aucApi from './aucations/api/aucationApi'
import { useAuthStore } from './auth/states/authStore'
import { useUsersStore } from './users/states/usersStore'
import { useAucationsStore } from './aucations/states/aucationsStore'

const fail = (message = 'Gagal', statusCode = 400) => Object.assign(new Error(message), { statusCode })

beforeEach(() => {
  vi.resetAllMocks()
  createMockPinia()
})

describe('authStore', () => {
  it('membaca token awal dari localStorage', () => {
    putAccessToken('t0')
    expect(useAuthStore().token).toBe('t0')
  })

  it('login sukses menyimpan token', async () => {
    authApi.loginApi.mockResolvedValue(apiOk({ token: 'tok' }, 'Berhasil login'))
    const s = useAuthStore()
    const res = await s.login({ email: 'e', password: 'p' })
    expect(res).toEqual({ ok: true, message: 'Berhasil login' })
    expect(s.token).toBe('tok')
    expect(getAccessToken()).toBe('tok')
    expect(s.isValid).toBe(true)
    expect(s.isAuthLogin).toBe(false)
  })

  it('login gagal menandai tidak valid', async () => {
    authApi.loginApi.mockRejectedValue(fail('Kredensial salah'))
    const s = useAuthStore()
    expect(await s.login({})).toEqual({ ok: false, message: 'Kredensial salah' })
    expect(s.isValid).toBe(false)
    expect(s.message).toBe('Kredensial salah')
  })

  it('register', async () => {
    authApi.registerApi.mockResolvedValue(apiOk({}, 'Terdaftar'))
    const s = useAuthStore()
    expect((await s.register({})).ok).toBe(true)
    expect(s.isAuthRegister).toBe(false)
  })

  it('logout selalu menghapus sesi lokal', async () => {
    putAccessToken('tok')
    authApi.logoutApi.mockRejectedValue(fail('Unauthenticated.', 401))
    const s = useAuthStore()
    const res = await s.logout()
    expect(res.ok).toBe(false)
    expect(s.token).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it('clearSession', () => {
    putAccessToken('x')
    const s = useAuthStore()
    s.clearSession()
    expect(s.token).toBeNull()
    expect(getAccessToken()).toBeNull()
  })
})

describe('usersStore', () => {
  it('fetchUsers / fetchUser / fetchProfile', async () => {
    userApi.getUsersApi.mockResolvedValue(apiOk({ users: [{ id: 1 }] }))
    userApi.getUserApi.mockResolvedValue(apiOk({ user: { id: 2 } }))
    userApi.getProfileApi.mockResolvedValue(apiOk({ user: { id: 3 } }))
    const s = useUsersStore()
    expect((await s.fetchUsers()).ok).toBe(true)
    expect(s.users).toEqual([{ id: 1 }])
    await s.fetchUser(2)
    expect(s.user).toEqual({ id: 2 })
    await s.fetchProfile()
    expect(s.profile).toEqual({ id: 3 })
    expect(s.isUsers).toBe(false)
  })

  it('galat fetch mengembalikan pesan & statusCode', async () => {
    userApi.getProfileApi.mockRejectedValue(fail('Unauthenticated.', 401))
    expect(await useUsersStore().fetchProfile()).toEqual({ ok: false, message: 'Unauthenticated.', statusCode: 401 })
  })

  it('updateProfile, changePhoto, changePassword', async () => {
    userApi.updateProfileApi.mockResolvedValue(apiOk({ user: { id: 1, name: 'Baru' } }, 'Diubah'))
    userApi.changePhotoApi.mockResolvedValue(apiOk({}, 'Foto diubah'))
    userApi.getProfileApi.mockResolvedValue(apiOk({ user: { id: 1, photo: 'p' } }))
    userApi.changePasswordApi.mockResolvedValue(apiOk({}, 'Sandi diubah'))
    const s = useUsersStore()

    expect(await s.updateProfile({})).toEqual({ ok: true, message: 'Diubah' })
    expect(s.profile.name).toBe('Baru')
    expect(s.isProfileChanged).toBe(true)

    expect((await s.changePhoto(new File(['x'], 'a.png'))).message).toBe('Foto diubah')
    expect(s.profile.photo).toBe('p')
    expect(s.isPhotoChanged).toBe(true)

    expect((await s.changePassword({})).ok).toBe(true)
    expect(s.isPasswordChanged).toBe(true)

    userApi.changePasswordApi.mockRejectedValue(fail('Salah'))
    expect((await s.changePassword({})).ok).toBe(false)
    expect(s.isPasswordChanged).toBe(false)
    expect(s.isPasswordChange).toBe(false)
  })
})

describe('aucationsStore', () => {
  it('fetchAucations & fetchAucation', async () => {
    aucApi.getAucationsApi.mockResolvedValue(apiOk({ aucations: [{ id: 1 }] }))
    aucApi.getAucationApi.mockResolvedValue(apiOk({ aucation: { id: 9 } }))
    const s = useAucationsStore()
    await s.fetchAucations({ is_me: 1 })
    expect(aucApi.getAucationsApi).toHaveBeenCalledWith({ is_me: 1 })
    expect(s.aucations).toEqual([{ id: 1 }])
    await s.fetchAucation(9)
    expect(s.aucation).toEqual({ id: 9 })
    expect(s.isAucation).toBe(false)
  })

  it('galat fetch', async () => {
    aucApi.getAucationApi.mockRejectedValue(fail('Tidak ada', 404))
    expect(await useAucationsStore().fetchAucation(1)).toEqual({ ok: false, message: 'Tidak ada', statusCode: 404 })
  })

  it.each([
    ['addAucation', 'addAucationApi', 'isAucationAdded', [{}]],
    ['changeAucation', 'updateAucationApi', 'isAucationChanged', [1, {}]],
    ['changeCover', 'changeCoverApi', 'isAucationChangedCover', [1, null]],
    ['deleteAucation', 'deleteAucationApi', 'isAucationDeleted', [1]],
    ['addBid', 'addBidApi', 'isBidAdded', [1, 100]],
    ['deleteBid', 'deleteBidApi', 'isBidDeleted', [1]],
    ['deleteAllAucations', 'deleteAllAucationsApi', 'isAucationDeletedAll', []],
  ])('%s: sukses & gagal', async (action, apiName, doneFlag, args) => {
    const s = useAucationsStore()
    aucApi[apiName].mockResolvedValueOnce(apiOk({}, 'Sukses'))
    expect(await s[action](...args)).toEqual({ ok: true, message: 'Sukses' })
    expect(s[doneFlag]).toBe(true)

    aucApi[apiName].mockRejectedValueOnce(fail('Gagal'))
    expect((await s[action](...args)).ok).toBe(false)
    expect(s[doneFlag]).toBe(false)
  })
})
