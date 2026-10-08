import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, assetUrl, getAccessToken, putAccessToken } from './apiHelper'

const mockFetch = (json, ok = true, status = 200) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(json) }))

afterEach(() => vi.unstubAllGlobals())

describe('token helpers', () => {
  it('menyimpan, membaca, dan menghapus token', () => {
    expect(getAccessToken()).toBeNull()
    putAccessToken('abc')
    expect(getAccessToken()).toBe('abc')
    putAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })
})

describe('assetUrl', () => {
  it('menangani kosong, absolut, dan relatif', () => {
    expect(assetUrl('')).toBe('')
    expect(assetUrl('https://x.test/a.png')).toBe('https://x.test/a.png')
    expect(assetUrl('/img/a.png')).toBe('https://open-api.delcom.org/img/a.png')
    expect(assetUrl('img/a.png')).toBe('https://open-api.delcom.org/img/a.png')
  })
})

describe('apiFetch', () => {
  it('GET dengan query params, mengabaikan nilai kosong, dan header Authorization', async () => {
    putAccessToken('tok')
    mockFetch({ status: 'success', data: 1 })
    const res = await apiFetch('/aucations', { params: { is_me: 1, a: undefined, b: null, c: '' } })
    expect(res.data).toBe(1)
    const [url, init] = fetch.mock.calls[0]
    expect(String(url)).toBe('https://open-api.delcom.org/api/v1/aucations?is_me=1')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.method).toBe('GET')
  })

  it('tanpa params & token, body JSON dan FormData', async () => {
    mockFetch({ status: 'success' })
    await apiFetch('/x', { method: 'POST', body: { a: 1 } })
    let [, init] = fetch.mock.calls[0]
    expect(init.headers.Authorization).toBeUndefined()
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"a":1}')

    const fd = new FormData()
    await apiFetch('/x', { method: 'POST', formData: fd })
    ;[, init] = fetch.mock.calls[1]
    expect(init.body).toBe(fd)
    expect(init.headers['Content-Type']).toBeUndefined()

    await apiFetch('/x')
    ;[, init] = fetch.mock.calls[2]
    expect(init.body).toBeUndefined()
  })

  it('melempar galat dengan data & statusCode saat gagal', async () => {
    mockFetch({ status: 'fail', message: 'Data tidak valid', data: { field: ['x'] } }, false, 422)
    await expect(apiFetch('/x')).rejects.toMatchObject({ message: 'Data tidak valid', statusCode: 422, data: { field: ['x'] } })
  })

  it('pesan default saat respons bukan JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) }))
    await expect(apiFetch('/x')).rejects.toThrow('Terjadi kesalahan pada server')
  })
})
