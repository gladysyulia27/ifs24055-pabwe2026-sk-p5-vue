<script setup>
import { computed, onMounted } from 'vue'
import { useUsersStore } from '../states/usersStore'
import { useInput } from '../../../hooks/useInput'
import { assetUrl } from '../../../helpers/apiHelper'
import { formatDate } from '../../../helpers/toolsHelper'

const store = useUsersStore()
const keyword = useInput('')
const filtered = computed(() => {
  const q = keyword.value.value.toLowerCase()
  return store.users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
})

onMounted(() => store.fetchUsers())
</script>

<template>
  <section>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold">Daftar Pengguna</h1>
      <input class="input max-w-xs" placeholder="Cari nama / email..." :value="keyword.value.value" @input="keyword.onChange" />
    </div>
    <p v-if="store.isUsers" class="text-slate-500">Memuat pengguna...</p>
    <p v-else-if="!filtered.length" class="text-slate-500">Pengguna tidak ditemukan.</p>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="u in filtered" :key="u.id" class="card flex items-center gap-4 p-4">
        <img :src="assetUrl(u.photo)" :alt="u.name" class="h-14 w-14 rounded-full bg-slate-200 object-cover" />
        <div class="min-w-0">
          <h2 class="truncate font-bold">{{ u.name }}</h2>
          <p class="truncate text-sm text-slate-500">{{ u.email }}</p>
          <p class="text-xs text-slate-400">Bergabung {{ formatDate(u.created_at) }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
