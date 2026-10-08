import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  changePasswordApi,
  changePhotoApi,
  getProfileApi,
  getUserApi,
  getUsersApi,
  updateProfileApi,
} from '../api/userApi'
import { getErrorMessage } from '../../../helpers/toolsHelper'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const user = ref(null)
  const profile = ref(null)
  const isUsers = ref(false)
  const isProfile = ref(false)
  const isProfileChange = ref(false)
  const isProfileChanged = ref(false)
  const isPhotoChange = ref(false)
  const isPhotoChanged = ref(false)
  const isPasswordChange = ref(false)
  const isPasswordChanged = ref(false)

  // Menjalankan aksi async + mengelola flag loading; mengembalikan {ok, message}
  async function run(pending, fn) {
    pending.value = true
    try {
      const message = await fn()
      return { ok: true, message }
    } catch (error) {
      return { ok: false, message: getErrorMessage(error), statusCode: error.statusCode }
    } finally {
      pending.value = false
    }
  }

  async function mutate(pending, done, fn) {
    done.value = false
    const result = await run(pending, async () => (await fn()).message)
    done.value = result.ok
    return result
  }

  const fetchUsers = () => run(isUsers, async () => (users.value = (await getUsersApi()).data.users))
  const fetchUser = (id) => run(isUsers, async () => (user.value = (await getUserApi(id)).data.user))
  const fetchProfile = () => run(isProfile, async () => (profile.value = (await getProfileApi()).data.user))

  const updateProfile = (payload) =>
    mutate(isProfileChange, isProfileChanged, async () => {
      const response = await updateProfileApi(payload)
      profile.value = response.data.user
      return response
    })

  const changePhoto = (file) =>
    mutate(isPhotoChange, isPhotoChanged, async () => {
      const response = await changePhotoApi(file)
      await fetchProfile()
      return response
    })

  const changePassword = (payload) => mutate(isPasswordChange, isPasswordChanged, () => changePasswordApi(payload))

  return {
    users, user, profile, isUsers, isProfile, isProfileChange, isProfileChanged, isPhotoChange,
    isPhotoChanged, isPasswordChange, isPasswordChanged,
    fetchUsers, fetchUser, fetchProfile, updateProfile, changePhoto, changePassword,
  }
})
