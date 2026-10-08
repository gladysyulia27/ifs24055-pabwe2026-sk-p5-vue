const TOKEN_KEY = 'delcom_auction_token'

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)

export const putAccessToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Foto dari API kadang berupa path relatif (mis. "img/profile/1.png")
export const assetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${new URL(DELCOM_BASEURL).origin}/${path.replace(/^\//, '')}`
}

export async function apiFetch(path, { method = 'GET', params, body, formData } = {}) {
  const url = new URL(`${DELCOM_BASEURL}${path}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })

  const headers = { Accept: 'application/json' }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const init = { method, headers }
  if (formData) {
    init.body = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  const response = await fetch(url, init)
  const json = await response.json().catch(() => ({}))

  if (!response.ok || json.status !== 'success') {
    const error = new Error(json.message || 'Terjadi kesalahan pada server')
    error.data = json.data
    error.statusCode = response.status
    throw error
  }
  return json
}
