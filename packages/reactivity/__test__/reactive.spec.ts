import { reactive, toRaw } from '../src/reactive'

describe('reactivity/reactive', () => {
  test('toRaw', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(toRaw(observed)).toBe(original)
    expect(toRaw(original)).toBe(original)
  })
})
