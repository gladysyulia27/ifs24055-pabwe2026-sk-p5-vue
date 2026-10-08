<script setup>
import { computed, ref } from 'vue'
import { useAucationsStore } from '../../states/aucationsStore'
import { useInput } from '../../../../hooks/useInput'
import { formatRupiah, getHighestBid, showErrorDialog, showSuccessDialog } from '../../../../helpers/toolsHelper'

const props = defineProps({ open: { type: Boolean, default: false }, aucation: { type: Object, default: null } })
const emit = defineEmits(['close', 'done'])
const store = useAucationsStore()
const bid = useInput('')
const error = ref('')
const highest = computed(() => getHighestBid(props.aucation))

async function submit() {
  const amount = Number(bid.value.value)
  error.value = ''
  if (highest.value !== null && amount <= highest.value) {
    error.value = `Tawaran harus lebih tinggi dari ${formatRupiah(highest.value)}`
  } else if (highest.value === null && amount < props.aucation.start_bid) {
    error.value = `Tawaran minimal ${formatRupiah(props.aucation.start_bid)}`
  }
  if (error.value) return

  const result = await store.addBid(props.aucation.id, amount)
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  bid.reset()
  emit('done')
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog">
    <form class="card w-full max-w-md space-y-4 p-6" novalidate @submit.prevent="submit">
      <h2 class="text-lg font-extrabold">Ajukan Tawaran</h2>
      <p class="text-sm text-slate-500">
        {{ highest === null ? `Harga awal ${formatRupiah(aucation.start_bid)}` : `Tawaran tertinggi ${formatRupiah(highest)}` }}
      </p>
      <div>
        <label class="label" for="bid-amount">Nominal Tawaran (Rp)</label>
        <input id="bid-amount" type="number" class="input" :value="bid.value.value" @input="bid.onChange" />
        <p v-if="error" class="mt-1 text-xs text-rose-600">{{ error }}</p>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" :disabled="store.isBidAdd">
          {{ store.isBidAdd ? 'Mengirim...' : 'Kirim Tawaran' }}
        </button>
      </div>
    </form>
  </div>
</template>
