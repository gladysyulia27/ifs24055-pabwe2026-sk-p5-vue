<script setup>
import { ref, watch } from 'vue'
import MarkdownEditor from '../MarkdownEditor.vue'
import { useAucationsStore } from '../../states/aucationsStore'
import { useInput } from '../../../../hooks/useInput'
import { showErrorDialog, showSuccessDialog, toApiDate, toInputDate } from '../../../../helpers/toolsHelper'

const props = defineProps({ open: { type: Boolean, default: false }, aucation: { type: Object, default: null } })
const emit = defineEmits(['close', 'done'])
const store = useAucationsStore()
const title = useInput('')
const startBid = useInput('')
const closedAt = useInput('')
const description = ref('')
const errors = ref({})

watch(
  () => props.aucation,
  (a) => {
    title.value.value = a?.title ?? ''
    startBid.value.value = a?.start_bid ?? ''
    closedAt.value.value = toInputDate(a?.closed_at)
    description.value = a?.description ?? ''
  },
  { immediate: true },
)

async function submit() {
  errors.value = {}
  if (!title.value.value.trim()) errors.value.title = 'Judul wajib diisi'
  if (!description.value.trim()) errors.value.description = 'Deskripsi wajib diisi'
  if (!(Number(startBid.value.value) > 0)) errors.value.start_bid = 'Harga awal harus lebih dari 0'
  if (!closedAt.value.value) errors.value.closed_at = 'Batas waktu wajib diisi'
  if (Object.keys(errors.value).length) return

  const result = await store.changeAucation(props.aucation.id, {
    title: title.value.value,
    description: description.value,
    start_bid: Number(startBid.value.value),
    closed_at: toApiDate(closedAt.value.value),
  })
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  emit('done')
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4" role="dialog">
    <form class="card w-full max-w-xl space-y-4 p-6" novalidate @submit.prevent="submit">
      <h2 class="text-lg font-extrabold">Ubah Lelang</h2>
      <div>
        <label class="label" for="chg-title">Judul</label>
        <input id="chg-title" class="input" :value="title.value.value" @input="title.onChange" />
        <p v-if="errors.title" class="mt-1 text-xs text-rose-600">{{ errors.title }}</p>
      </div>
      <div>
        <span class="label">Deskripsi</span>
        <MarkdownEditor v-model="description" />
        <p v-if="errors.description" class="mt-1 text-xs text-rose-600">{{ errors.description }}</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="chg-bid">Harga Awal (Rp)</label>
          <input id="chg-bid" type="number" class="input" :value="startBid.value.value" @input="startBid.onChange" />
          <p v-if="errors.start_bid" class="mt-1 text-xs text-rose-600">{{ errors.start_bid }}</p>
        </div>
        <div>
          <label class="label" for="chg-closed">Ditutup Pada</label>
          <input id="chg-closed" type="datetime-local" class="input" :value="closedAt.value.value" @input="closedAt.onChange" />
          <p v-if="errors.closed_at" class="mt-1 text-xs text-rose-600">{{ errors.closed_at }}</p>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" :disabled="store.isAucationChange">
          {{ store.isAucationChange ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </form>
  </div>
</template>
