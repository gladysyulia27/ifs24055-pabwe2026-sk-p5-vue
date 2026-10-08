<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../states/authStore'
import { useInput } from '../../../hooks/useInput'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()
const name = useInput('')
const email = useInput('')
const password = useInput('')
const confirm = useInput('')
const errors = ref({})
const fields = [
  { id: 'name', label: 'Nama Lengkap', type: 'text', model: name },
  { id: 'email', label: 'Email', type: 'email', model: email },
  { id: 'password', label: 'Kata Sandi', type: 'password', model: password },
  { id: 'confirm', label: 'Konfirmasi Kata Sandi', type: 'password', model: confirm },
]

async function submit() {
  errors.value = {}
  if (!name.value.value.trim()) errors.value.name = 'Nama wajib diisi'
  if (!/^\S+@\S+\.\S+$/.test(email.value.value)) errors.value.email = 'Email tidak valid'
  if (password.value.value.length < 6) errors.value.password = 'Kata sandi minimal 6 karakter'
  if (confirm.value.value !== password.value.value) errors.value.confirm = 'Konfirmasi kata sandi tidak sama'
  if (Object.keys(errors.value).length) return

  const result = await auth.register({
    name: name.value.value,
    email: email.value.value,
    password: password.value.value,
  })
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  router.push('/auth/login')
}
</script>

<template>
  <div class="card p-8">
    <h1 class="text-2xl font-extrabold">Buat Akun</h1>
    <p class="mt-1 text-sm text-slate-500">Daftar gratis dan mulai menawar.</p>
    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <div v-for="f in fields" :key="f.id">
        <label class="label" :for="f.id">{{ f.label }}</label>
        <input :id="f.id" :type="f.type" class="input" :value="f.model.value.value" @input="f.model.onChange" />
        <p v-if="errors[f.id]" class="mt-1 text-xs text-rose-600">{{ errors[f.id] }}</p>
      </div>
      <button type="submit" class="btn btn-primary w-full" :disabled="auth.isAuthRegister">
        {{ auth.isAuthRegister ? 'Memproses...' : 'Daftar' }}
      </button>
    </form>
    <p class="mt-6 text-center text-sm text-slate-500">
      Sudah punya akun?
      <RouterLink to="/auth/login" class="font-semibold text-brand-600">Masuk</RouterLink>
    </p>
  </div>
</template>
