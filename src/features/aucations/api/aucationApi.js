import { apiFetch } from '../../../helpers/apiHelper'

// params: { is_me: 1 } | { is_closed: 0 | 1 }
export const getAucationsApi = (params = {}) => apiFetch('/aucations', { params })
export const getAucationApi = (id) => apiFetch(`/aucations/${id}`)

const pick = ({ title, description, start_bid, closed_at }) => ({ title, description, start_bid, closed_at })

export const addAucationApi = (payload) => apiFetch('/aucations', { method: 'POST', body: pick(payload) })
export const updateAucationApi = (id, payload) => apiFetch(`/aucations/${id}`, { method: 'PUT', body: pick(payload) })

export const changeCoverApi = (id, file) => {
  const formData = new FormData()
  formData.append('cover', file)
  return apiFetch(`/aucations/${id}/cover`, { method: 'POST', formData })
}

export const deleteAucationApi = (id) => apiFetch(`/aucations/${id}`, { method: 'DELETE' })
export const addBidApi = (id, bid) => apiFetch(`/aucations/${id}/bids`, { method: 'POST', body: { bid } })
export const deleteBidApi = (id) => apiFetch(`/aucations/${id}/bids`, { method: 'DELETE' })
export const deleteAllAucationsApi = () => apiFetch('/aucations', { method: 'DELETE' })
