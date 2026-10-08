<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useAucationsStore } from '../../states/aucationsStore'
import { showErrorDialog, showSuccessDialog } from '../../../../helpers/toolsHelper'

const props = defineProps({ open: { type: Boolean, default: false }, aucationId: { type: [Number, String], default: null } })
const emit = defineEmits(['close', 'done'])
const store = useAucationsStore()
const file = ref(null)
const preview = ref('')
const error = ref('')

function revoke() {
  if (preview.value) URL.revokeObjectURL(preview.value)
}

function onFile(event) {
  revoke()
  file.value = event.target.files?.[0] ?? null
  preview.value = file.value ? URL.createObjectURL(file.value) : ''
}

async function submit() {
  error.value = ''
  if (!file.value) {
    error.value = 'Pilih gambar terlebih dahulu'
    return
  }
  const result = await store.changeCover(props.aucationId, file.value)
  if (!result.ok) return showErrorDialog(result.message)
  await showSuccessDialog(result.message)
  revoke()
  file.value = null
  preview.value = ''
  emit('done')
  emit('close')
}

onBeforeUnmount(revoke)
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog">
    <form class="card w-full max-w-md space-y-4 p-6" @submit.prevent="submit">
      <h2 class="text-lg font-extrabold">Ganti Cover</h2>
      <input type="file" accept="image/*" class="input" data-testid="cover-input" @change="onFile" />
      <p v-if="error" class="text-xs text-rose-600">{{ error }}</p>
      <img v-if="preview" :src="preview" alt="Pratinjau cover" class="max-h-60 w-full rounded-xl object-cover" />
      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" :disabled="store.isAucationChangeCover">
          {{ store.isAucationChangeCover ? 'Mengunggah...' : 'Unggah' }}
        </button>
      </div>
    </form>
  </div>
</template>
