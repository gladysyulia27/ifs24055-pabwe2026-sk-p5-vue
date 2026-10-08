import { describe, expect, it } from 'vitest'
import { useInput } from './useInput'

describe('useInput', () => {
  it('nilai awal default kosong', () => {
    expect(useInput().value.value).toBe('')
  })

  it('onChange menerima event maupun nilai langsung, dan reset', () => {
    const { value, onChange, reset } = useInput('a')
    onChange({ target: { value: 'b' } })
    expect(value.value).toBe('b')
    onChange('c')
    expect(value.value).toBe('c')
    onChange(undefined)
    expect(value.value).toBeUndefined()
    reset()
    expect(value.value).toBe('a')
  })
})
