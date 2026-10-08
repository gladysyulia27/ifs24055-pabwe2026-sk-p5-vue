<script setup>
import { useRouter } from 'vue-router'
import { Gavel, LogOut, Menu } from 'lucide-vue-next'
import { useUsersStore } from '../../users/states/usersStore'
import { useAuthStore } from '../../auth/states/authStore'
import { assetUrl } from '../../../helpers/apiHelper'
import { showConfirmDialog } from '../../../helpers/toolsHelper'

defineEmits(['toggle-sidebar'])
const router = useRouter()
const users = useUsersStore()
const auth = useAuthStore()

async function logout() {
  if (!(await showConfirmDialog('Anda akan keluar dari akun ini.', 'Logout?'))) return
  await auth.logout()
  router.replace('/auth/login')
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
    <div class="flex items-center gap-3">
      <button class="btn btn-outline lg:hidden" aria-label="Buka menu" @click="$emit('toggle-sidebar')"><Menu class="h-4 w-4" /></button>
      <RouterLink to="/" class="flex items-center gap-2 text-lg font-extrabold text-brand-700"><Gavel class="h-5 w-5" /> Delcom Auction</RouterLink>
    </div>
    <div class="flex items-center gap-3">
      <RouterLink to="/profile" class="flex items-center gap-2">
        <img v-if="users.profile" :src="assetUrl(users.profile.photo)" alt="Avatar" class="h-8 w-8 rounded-full bg-slate-200 object-cover" />
        <span class="hidden text-sm font-semibold sm:inline">{{ users.profile?.name ?? 'Memuat...' }}</span>
      </RouterLink>
      <button class="btn btn-outline" :disabled="auth.isAuthLogout" @click="logout"><LogOut class="h-4 w-4" /> Logout</button>
    </div>
  </header>
</template>
