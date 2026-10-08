import { render } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from './router'

// Pinia dengan state awal opsional, mis. { users: { profile: { id: 1 } } }
export function createMockPinia(initialState = {}) {
  const pinia = createPinia()
  pinia.state.value = initialState
  setActivePinia(pinia)
  return pinia
}

// Render komponen lengkap dengan Pinia + router (memory history)
export async function renderWithProviders(component, { route = '/', props = {}, state = {}, global = {} } = {}) {
  const pinia = createMockPinia(state)
  const router = createAppRouter(createMemoryHistory())
  router.push(route)
  await router.isReady()
  const utils = render(component, {
    props,
    global: { ...global, plugins: [pinia, router, ...(global.plugins ?? [])] },
  })
  return { ...utils, router, pinia }
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

export const apiOk = (data = {}, message = 'OK') => ({ status: 'success', message, data })

import { defineComponent, h } from 'vue'

// Pengganti MarkdownEditor untuk pengujian form (textarea biasa)
export const MarkdownEditorStub = defineComponent({
  name: 'MarkdownEditor',
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () =>
    h('textarea', {
      'data-testid': 'md',
      value: props.modelValue,
      onInput: (e) => emit('update:modelValue', e.target.value),
    }),
})
