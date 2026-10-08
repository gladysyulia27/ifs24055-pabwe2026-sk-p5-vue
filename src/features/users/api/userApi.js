import { apiFetch } from '../../../helpers/apiHelper'

export const getUsersApi = () => apiFetch('/users')
export const getUserApi = (id) => apiFetch(`/users/${id}`)
export const getProfileApi = () => apiFetch('/users/me')
export const updateProfileApi = ({ name, email }) => apiFetch('/users/me', { method: 'PUT', body: { name, email } })

export const changePhotoApi = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return apiFetch('/users/me/photo', { method: 'POST', formData })
}

// Sesuai dokumentasi Delcom Open API: PUT /users/password
export const changePasswordApi = ({ password, new_password, new_password_confirmation }) =>
  apiFetch('/users/password', { method: 'PUT', body: { password, new_password, new_password_confirmation } })
