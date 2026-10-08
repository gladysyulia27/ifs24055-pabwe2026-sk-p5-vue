import { ref } from 'vue'

export function useInput(initialValue = '') {
  const value = ref(initialValue)
  const onChange = (event) => {
    value.value = event?.target ? event.target.value : event
  }
  const reset = () => {
    value.value = initialValue
  }
  return { value, onChange, reset }
}
