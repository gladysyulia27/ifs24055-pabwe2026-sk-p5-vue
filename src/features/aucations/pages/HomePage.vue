<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock, ImageOff, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { useAucationsStore } from '../states/aucationsStore'
import { useUsersStore } from '../../users/states/usersStore'
import AddModal from '../components/modals/AddModal.vue'
import ChangeModal from '../components/modals/ChangeModal.vue'
import { useInput } from '../../../hooks/useInput'
import {
  formatRupiah, getCountdown, getHighestBid, showConfirmDialog, showErrorDialog, showSuccessDialog,
} from '../../../helpers/toolsHelper'

const TABS = [
  { key: 'all', label: 'Semua Lelang', params: {} },
  { key: 'mine', label: 'Lelang Saya', params: { is_me: 1 } },
  { key: 'open', label: 'Lelang Berlangsung', params: { is_closed: 1 } },
  { key: 'closed', label: 'Lelang Ditutup', params: { is_closed: 0 } },
]

const route = useRoute()
const router = useRouter()
const store = useAucationsStore()
const users = useUsersStore()
const keyword = useInput('')
const showAdd = ref(false)
const editing = ref(null)

const tab = computed(() => TABS.find((t) => t.key === route.query.tab) ?? TABS[0])
const load = () => store.fetchAucations(tab.value.params)
watch(tab, load, { immediate: true })

const filtered = computed(() => {
  const q = keyword.value.value.toLowerCase()
  return store.aucations.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
})

const isOwner = (a) => users.profile?.id === a.user_id
const setTab = (key) => router.push({ path: '/', query: key === 'all' ? {} : { tab: key } })

async function remove(a) {
  if (!(await showConfirmDialog(`Lelang "${a.title}" akan dihapus permanen.`))) return
  const result = await store.deleteAucation(a.id)
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  load()
}

async function removeAll() {
  if (!(await showConfirmDialog('Semua lelang milik Anda akan dihapus permanen.'))) return
  const result = await store.deleteAllAucations()
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  load()
}
</script>

<template>
  <section>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold">Dashboard Lelang</h1>
      <div class="flex gap-2">
        <button v-if="tab.key === 'mine' && filtered.length" class="btn btn-outline" @click="removeAll">
          <Trash2 class="h-4 w-4" /> Hapus Semua
        </button>
        <button class="btn btn-primary" @click="showAdd = true"><Plus class="h-4 w-4" /> Tambah Lelang</button>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="t in TABS" :key="t.key" class="btn"
        :class="tab.key === t.key ? 'btn-primary' : 'btn-outline'" @click="setTab(t.key)"
      >{{ t.label }}</button>
    </div>
    <input class="input mb-6 max-w-md" placeholder="Cari judul atau deskripsi..." :value="keyword.value.value" @input="keyword.onChange" />

    <p v-if="store.isAucation" class="text-slate-500">Memuat lelang...</p>
    <p v-else-if="!filtered.length" class="text-slate-500">Belum ada lelang.</p>
    <div v-else class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="a in filtered" :key="a.id" class="card overflow-hidden" data-testid="aucation-card">
        <div class="flex h-44 items-center justify-center bg-slate-100">
          <img v-if="a.cover" :src="a.cover" :alt="a.title" class="h-full w-full object-cover" />
          <ImageOff v-else class="h-8 w-8 text-slate-400" />
        </div>
        <div class="space-y-2 p-4">
          <h2 class="truncate text-lg font-bold">{{ a.title }}</h2>
          <p class="text-xs text-slate-500">oleh {{ a.author.name }}</p>
          <p class="text-sm">Harga awal: <b>{{ formatRupiah(a.start_bid) }}</b></p>
          <p v-if="getHighestBid(a) !== null" class="text-sm">Tertinggi: <b class="text-brand-700">{{ formatRupiah(getHighestBid(a)) }}</b></p>
          <p v-else class="text-sm text-slate-500">{{ a.bids.length }} penawaran</p>
          <p class="flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock class="h-3.5 w-3.5" /> {{ getCountdown(a.closed_at) }}</p>
          <div class="flex items-center gap-2 pt-2">
            <RouterLink :to="`/aucations/${a.id}`" class="btn btn-primary flex-1">Detail</RouterLink>
            <template v-if="isOwner(a)">
              <button class="btn btn-outline" aria-label="Ubah" @click="editing = a"><Pencil class="h-4 w-4" /></button>
              <button class="btn btn-outline" aria-label="Hapus" @click="remove(a)"><Trash2 class="h-4 w-4" /></button>
            </template>
          </div>
        </div>
      </article>
    </div>

    <AddModal :open="showAdd" @close="showAdd = false" @done="load" />
    <ChangeModal :open="!!editing" :aucation="editing" @close="editing = null" @done="load" />
  </section>
</template>
