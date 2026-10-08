<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({ content: { type: String, default: '' } })
const el = ref(null)
let viewer

onMounted(async () => {
  const [{ default: Viewer }] = await Promise.all([
    import('@toast-ui/editor/dist/toastui-editor-viewer'),
    import('@toast-ui/editor/dist/toastui-editor-viewer.css')
  ])
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
