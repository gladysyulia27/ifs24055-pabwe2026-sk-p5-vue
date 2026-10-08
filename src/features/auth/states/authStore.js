import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loginApi, logoutApi, registerApi } from '../api/authApi'
import { getAccessToken, putAccessToken } from '../../../helpers/apiHelper'
import { getErrorMessage } from '../../../helpers/toolsHelper'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAccessToken())
  const isAuthLogin = ref(false)
  const isAuthRegister = ref(false)
  const isAuthLogout = ref(false)
  const isValid = ref(true)
  const message = ref('')

  async function run(flag, fn) {
    flag.value = true
    try {
      const result = await fn()
      isValid.value = true
      message.value = result.message
      return { ok: true, message: result.message }
    } catch (error) {
      isValid.value = false
      message.value = getErrorMessage(error)
      return { ok: false, message: message.value }
    } finally {
      flag.value = false
    }
  }

  const login = (payload) =>
    run(isAuthLogin, async () => {
      const result = await loginApi(payload)
      token.value = result.data.token
      putAccessToken(token.value)
      return result
    })

  const register = (payload) => run(isAuthRegister, () => registerApi(payload))

  async function logout() {
    // Token lokal selalu dihapus, meskipun token sudah kedaluwarsa di server
    const result = await run(isAuthLogout, () => logoutApi())
    clearSession()
    return result
  }

  function clearSession() {
    token.value = null
    putAccessToken(null)
  }

  return { token, isAuthLogin, isAuthRegister, isAuthLogout, isValid, message, login, register, logout, clearSession }
})
