<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../states/authStore'
import { useInput } from '../../../hooks/useInput'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()
const email = useInput('')
const password = useInput('')
const errors = ref({})

async function submit() {
  errors.value = {}
  if (!/^\S+@\S+\.\S+$/.test(email.value.value)) errors.value.email = 'Email tidak valid'
  if (!password.value.value) errors.value.password = 'Kata sandi wajib diisi'
  if (Object.keys(errors.value).length) return

  const result = await auth.login({ email: email.value.value, password: password.value.value })
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  router.push('/')
}
</script>

<template>
  <div class="card p-8">
    <h2 class="text-2xl font-extrabold">Masuk</h2>
    <p class="mt-1 text-sm text-slate-500">Silakan masuk untuk mulai melelang.</p>
    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label class="label" for="login-email-input">Email</label>
        <input id="login-email-input" type="email" class="input" :value="email.value.value" @input="email.onChange" />
        <p v-if="errors.email" class="mt-1 text-xs text-rose-600">{{ errors.email }}</p>
      </div>
      <div>
        <label class="label" for="login-password-input">Kata Sandi</label>
        <input id="login-password-input" type="password" class="input" :value="password.value.value" @input="password.onChange" />
        <p v-if="errors.password" class="mt-1 text-xs text-rose-600">{{ errors.password }}</p>
      </div>
      <button id="login-submit-button" type="submit" class="btn btn-primary w-full" :disabled="auth.isAuthLogin">
        {{ auth.isAuthLogin ? 'Memproses...' : 'Masuk' }}
      </button>
    </form>
    <p class="mt-6 text-center text-sm text-slate-500">
      Belum punya akun?
      <RouterLink to="/auth/register" class="font-semibold text-brand-600">Daftar</RouterLink>
    </p>
  </div>
</template>
