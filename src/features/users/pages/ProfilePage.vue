<script setup>
import { onMounted, watch } from 'vue'
import { useUsersStore } from '../states/usersStore'
import { useInput } from '../../../hooks/useInput'
import { assetUrl } from '../../../helpers/apiHelper'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const store = useUsersStore()
const name = useInput('')
const email = useInput('')
const oldPassword = useInput('')
const newPassword = useInput('')
const confirmPassword = useInput('')

watch(
  () => store.profile,
  (profile) => {
    name.value.value = profile?.name ?? ''
    email.value.value = profile?.email ?? ''
  },
  { immediate: true },
)

onMounted(() => store.fetchProfile())

async function report(result) {
  if (result.ok) await showSuccessDialog(result.message)
  else await showErrorDialog(result.message)
  return result.ok
}

const saveProfile = async () => report(await store.updateProfile({ name: name.value.value, email: email.value.value }))

async function onPhoto(event) {
  const file = event.target.files?.[0]
  if (file) await report(await store.changePhoto(file))
}

async function savePassword() {
  const ok = await report(
    await store.changePassword({
      password: oldPassword.value.value,
      new_password: newPassword.value.value,
      new_password_confirmation: confirmPassword.value.value,
    }),
  )
  if (ok) [oldPassword, newPassword, confirmPassword].forEach((f) => f.reset())
}
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-6">
    <h1 class="text-2xl font-extrabold">Profil Saya</h1>

    <div class="card flex items-center gap-5 p-6">
      <img :src="assetUrl(store.profile?.photo)" alt="Foto profil" class="h-20 w-20 rounded-full bg-slate-200 object-cover" />
      <div>
        <label class="btn btn-outline cursor-pointer">
          {{ store.isPhotoChange ? 'Mengunggah...' : 'Ganti Foto' }}
          <input type="file" accept="image/*" class="hidden" data-testid="photo-input" @change="onPhoto" />
        </label>
      </div>
    </div>

    <form class="card space-y-4 p-6" @submit.prevent="saveProfile">
      <h2 class="font-bold">Informasi Akun</h2>
      <div>
        <label class="label" for="p-name">Nama</label>
        <input id="p-name" class="input" :value="name.value.value" @input="name.onChange" />
      </div>
      <div>
        <label class="label" for="p-email">Email</label>
        <input id="p-email" type="email" class="input" :value="email.value.value" @input="email.onChange" />
      </div>
      <button class="btn btn-primary" :disabled="store.isProfileChange">
        {{ store.isProfileChange ? 'Menyimpan...' : 'Simpan Perubahan' }}
      </button>
    </form>

    <form class="card space-y-4 p-6" @submit.prevent="savePassword">
      <h2 class="font-bold">Ganti Kata Sandi</h2>
      <div>
        <label class="label" for="p-old">Kata sandi saat ini</label>
        <input id="p-old" type="password" class="input" :value="oldPassword.value.value" @input="oldPassword.onChange" />
      </div>
      <div>
        <label class="label" for="p-new">Kata sandi baru</label>
        <input id="p-new" type="password" class="input" :value="newPassword.value.value" @input="newPassword.onChange" />
      </div>
      <div>
        <label class="label" for="p-confirm">Konfirmasi kata sandi baru</label>
        <input id="p-confirm" type="password" class="input" :value="confirmPassword.value.value" @input="confirmPassword.onChange" />
      </div>
      <button class="btn btn-primary" :disabled="store.isPasswordChange">
        {{ store.isPasswordChange ? 'Menyimpan...' : 'Ubah Kata Sandi' }}
      </button>
    </form>
  </section>
</template>
