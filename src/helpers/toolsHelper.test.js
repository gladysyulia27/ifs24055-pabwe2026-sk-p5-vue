import { describe, expect, it, vi } from 'vitest'
import Swal from 'sweetalert2'
import {
  formatDate, formatRupiah, getCountdown, getErrorMessage, getHighestBid, isClosed, showConfirmDialog,
  showErrorDialog, showSuccessDialog, toApiDate, toInputDate,
} from './toolsHelper'

describe('dialog', () => {
  it('success & error memanggil Swal', () => {
    const fire = vi.spyOn(Swal, 'fire').mockResolvedValue({})
    showSuccessDialog('ok')
    showErrorDialog('gagal')
    expect(fire).toHaveBeenNthCalledWith(1, expect.objectContaining({ icon: 'success', text: 'ok', title: 'Berhasil' }))
    expect(fire).toHaveBeenNthCalledWith(2, expect.objectContaining({ icon: 'error', text: 'gagal', title: 'Gagal' }))
  })

  it('confirm mengembalikan isConfirmed', async () => {
    const fire = vi.spyOn(Swal, 'fire')
    fire.mockResolvedValueOnce({ isConfirmed: true })
    expect(await showConfirmDialog('x')).toBe(true)
    fire.mockResolvedValueOnce({ isConfirmed: false })
    expect(await showConfirmDialog('x', 'Judul')).toBe(false)
  })
})

describe('format', () => {
  it('formatRupiah', () => {
    expect(formatRupiah(10000)).toMatch(/Rp\s?10\.000/)
    expect(formatRupiah('abc')).toMatch(/Rp\s?0/)
  })

  it('formatDate', () => {
    expect(formatDate('')).toBe('-')
    expect(formatDate('bukan tanggal')).toBe('-')
    expect(formatDate('2026-12-31 23:59:00')).toMatch(/2026/)
  })

  it('getErrorMessage', () => {
    expect(getErrorMessage({ message: 'Gagal', data: { email: ['Sudah dipakai'], x: [1] } })).toBe('Gagal\nSudah dipakai')
    expect(getErrorMessage({ message: 'Gagal', data: 'str' })).toBe('Gagal')
    expect(getErrorMessage(undefined)).toBe('Terjadi kesalahan')
  })

  it('konversi tanggal', () => {
    expect(toApiDate('2026-12-31T23:59')).toBe('2026-12-31 23:59:00')
    expect(toApiDate('2026-12-31 23:59:10')).toBe('2026-12-31 23:59:10')
    expect(toApiDate(undefined)).toBe('')
    expect(toInputDate('2026-12-31 23:59:00')).toBe('2026-12-31T23:59')
    expect(toInputDate(undefined)).toBe('')
  })
})

describe('lelang', () => {
  const now = new Date('2026-01-01T00:00:00').getTime()

  it('isClosed', () => {
    expect(isClosed('2025-12-31 00:00:00', now)).toBe(true)
    expect(isClosed('2026-02-01 00:00:00', now)).toBe(false)
    expect(isClosed('2025-12-31 00:00:00')).toBe(true)
  })

  it('getHighestBid', () => {
    expect(getHighestBid(null)).toBeNull()
    expect(getHighestBid({})).toBeNull()
    expect(getHighestBid({ bids: [2, 3] })).toBeNull()
    expect(getHighestBid({ bids: [{ bid: 5 }, { bid: 9 }, 4] })).toBe(9)
  })

  it('getCountdown', () => {
    expect(getCountdown('2025-12-31 00:00:00', now)).toBe('Ditutup')
    expect(getCountdown('2026-01-03 03:00:00', now)).toBe('2 hari 3 jam lagi')
    expect(getCountdown('2026-01-01 03:10:00', now)).toBe('3 jam 10 menit lagi')
    expect(getCountdown('2026-01-01 00:20:00', now)).toBe('20 menit lagi')
    expect(getCountdown('2025-12-31 00:00:00')).toBe('Ditutup')
  })
})
