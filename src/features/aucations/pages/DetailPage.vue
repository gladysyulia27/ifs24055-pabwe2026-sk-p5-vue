<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAucationsStore } from '../states/aucationsStore'
import { useUsersStore } from '../../users/states/usersStore'
import MarkdownViewer from '../components/MarkdownViewer.vue'
import BidModal from '../components/modals/BidModal.vue'
import ChangeModal from '../components/modals/ChangeModal.vue'
import ChangeCoverModal from '../components/modals/ChangeCoverModal.vue'
import {
  formatDate, formatRupiah, getCountdown, getHighestBid, isClosed, showConfirmDialog, showErrorDialog,
  showSuccessDialog,
} from '../../../helpers/toolsHelper'

const route = useRoute()
const router = useRouter()
const store = useAucationsStore()
const users = useUsersStore()
const modal = ref('')
const id = route.params.aucationId
const loadError = ref('')

const a = computed(() => store.aucation)
const owner = computed(() => users.profile?.id === a.value?.user_id)
const closed = computed(() => isClosed(a.value.closed_at))
const highest = computed(() => getHighestBid(a.value))

async function load() {
  const result = await store.fetchAucation(id)
  loadError.value = result.ok ? '' : result.message
}

async function perform(action, confirmText, after) {
  if (confirmText && !(await showConfirmDialog(confirmText))) return
  const result = await action()
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  after()
}

const removeAucation = () =>
  perform(() => store.deleteAucation(id), 'Lelang ini akan dihapus permanen.', () => router.replace('/'))
const cancelBid = () => perform(() => store.deleteBid(id), 'Tawaran Anda akan dibatalkan.', load)

onMounted(() => {
  store.aucation = null // hindari menampilkan data lelang sebelumnya
  load()
})
</script>

<template>
  <section v-if="loadError" class="card p-6 text-rose-600">{{ loadError }}</section>
  <p v-else-if="!a" class="text-slate-500">Memuat detail lelang...</p>
  <section v-else class="grid gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">
      <div class="card overflow-hidden">
        <img v-if="a.cover" :src="a.cover" :alt="a.title" class="max-h-96 w-full object-cover" />
        <div class="space-y-3 p-6">
          <h1 class="text-2xl font-extrabold">{{ a.title }}</h1>
          <p class="text-sm text-slate-500">Oleh {{ a.author.name }} &middot; ditutup {{ formatDate(a.closed_at) }}</p>
          <h2 class="sr-only">Deskripsi Lelang</h2>
          <MarkdownViewer :content="a.description" />
        </div>
      </div>

      <div class="card p-6">
        <h2 class="mb-3 font-bold">Riwayat Penawaran</h2>
        <p v-if="!a.bids.length" class="text-sm text-slate-500">Belum ada penawaran.</p>
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="b in a.bids" :key="b.id" class="flex justify-between py-2 text-sm">
            <span class="font-semibold">{{ formatRupiah(b.bid) }}</span>
            <span class="text-slate-500">{{ formatDate(b.created_at) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <aside class="card h-fit space-y-4 p-6">
      <p class="text-sm text-slate-500">Harga awal</p>
      <p class="text-xl font-extrabold">{{ formatRupiah(a.start_bid) }}</p>
      <p v-if="highest !== null" class="text-sm">Tertinggi: <b class="text-brand-700">{{ formatRupiah(highest) }}</b></p>
      <p class="text-sm font-semibold">{{ getCountdown(a.closed_at) }}</p>
      <p v-if="a.my_bid" class="rounded-xl bg-brand-50 p-3 text-sm">Tawaran Anda: <b>{{ formatRupiah(a.my_bid.bid) }}</b></p>

      <template v-if="owner">
        <button class="btn btn-outline w-full" @click="modal = 'change'">Ubah Lelang</button>
        <button class="btn btn-outline w-full" @click="modal = 'cover'">Ganti Cover</button>
        <button class="btn btn-danger w-full" @click="removeAucation">Hapus Lelang</button>
      </template>
      <template v-else-if="!closed">
        <button class="btn btn-primary w-full" @click="modal = 'bid'">Ajukan Tawaran</button>
        <button v-if="a.my_bid" class="btn btn-outline w-full" @click="cancelBid">Batalkan Tawaran</button>
      </template>
    </aside>

    <BidModal :open="modal === 'bid'" :aucation="a" @close="modal = ''" @done="load" />
    <ChangeModal :open="modal === 'change'" :aucation="a" @close="modal = ''" @done="load" />
    <ChangeCoverModal :open="modal === 'cover'" :aucation-id="a.id" @close="modal = ''" @done="load" />
  </section>
</template>
