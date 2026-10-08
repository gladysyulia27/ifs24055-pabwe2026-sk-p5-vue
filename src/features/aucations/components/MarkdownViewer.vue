<script setup>
import { onMounted, ref, watch } from 'vue'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

const props = defineProps({ content: { type: String, default: '' } })
const el = ref(null)
let viewer

onMounted(() => {
  viewer = new Viewer({ el: el.value, initialValue: props.content })
})

watch(
  () => props.content,
  (value) => viewer?.setMarkdown(value),
)
</script>

<template>
  <div ref="el" data-testid="md-viewer" />
</template>
