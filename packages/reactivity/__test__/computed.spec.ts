import { computed } from '../src/computed'
import { effect } from '../src/effect'
import { reactive } from '../src/reactive'

describe('reactivity/computed', () => {
  test('should computed lazily', () => {
    const value = reactive<{ foo?: number }>({})
    const getter = jest.fn(() => value.foo)
    const cValue = computed(getter)

    // lazy
    expect(getter).not.toHaveBeenCalled()

    expect(cValue.value).toBe(undefined)
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    value.foo = 1
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(2)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })

  test('should trigger effect', () => {
    let dummy
    const value = reactive<{ foo?: number }>({})
    const cValue = computed(() => value.foo)
    effect(() => (dummy = cValue.value))

    expect(dummy).toBe(undefined)
    value.foo = 1
    expect(dummy).toBe(1)
  })
})
