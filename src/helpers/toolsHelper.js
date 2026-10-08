import Swal from 'sweetalert2'

export const showSuccessDialog = (message, title = 'Berhasil') =>
  Swal.fire({ icon: 'success', title, text: message, confirmButtonColor: '#4f46e5' })

export const showErrorDialog = (message, title = 'Gagal') =>
  Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#4f46e5' })

export const showConfirmDialog = async (message, title = 'Apakah Anda yakin?') => {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Ya, lanjutkan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#e11d48',
  })
  return result.isConfirmed
}

export const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  )

export const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

// Gabungkan pesan galat + pesan validasi per-field dari API
export const getErrorMessage = (error) => {
  const fields = error?.data && typeof error.data === 'object' ? Object.values(error.data).flat() : []
  return [error?.message || 'Terjadi kesalahan', ...fields.filter((f) => typeof f === 'string')].join('\n')
}

// "2026-12-31T23:59" (datetime-local) -> "2026-12-31 23:59:00"
export const toApiDate = (value) => {
  const text = String(value || '').replace('T', ' ')
  return text.length === 16 ? `${text}:00` : text
}

// "2026-12-31 23:59:00" -> "2026-12-31T23:59"
export const toInputDate = (value) => String(value || '').slice(0, 16).replace(' ', 'T')

export const isClosed = (closedAt, now = Date.now()) => new Date(String(closedAt).replace(' ', 'T')).getTime() <= now

// Daftar detail memuat bids sebagai objek, daftar umum hanya id
export const getHighestBid = (aucation) => {
  const amounts = (aucation?.bids ?? []).filter((b) => typeof b === 'object').map((b) => Number(b.bid))
  return amounts.length ? Math.max(...amounts) : null
}

export const getCountdown = (closedAt, now = Date.now()) => {
  const diff = new Date(String(closedAt).replace(' ', 'T')).getTime() - now
  if (diff <= 0) return 'Ditutup'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days} hari ${hours} jam lagi`
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`
  return `${minutes} menit lagi`
}
