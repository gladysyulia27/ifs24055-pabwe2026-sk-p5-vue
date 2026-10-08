<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const el = ref(null)
let editor

onMounted(async () => {
  const [{ default: Editor }] = await Promise.all([
    import('@toast-ui/editor'),
    import('@toast-ui/editor/dist/toastui-editor.css')
  ])
  editor = new Editor({
    el: el.value,
    height: '240px',
    initialEditType: 'wysiwyg',
    previewStyle: 'tab',
    hideModeSwitch: false,
    initialValue: props.modelValue,
    events: { change: () => emit('update:modelValue', editor.getMarkdown()) },
  })
})

onBeforeUnmount(() => editor?.destroy())
</script>

<template>
  <div ref="el" data-testid="md-editor" />
</template>
