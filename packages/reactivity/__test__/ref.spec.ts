import { effect } from '../src/effect'
import { reactive } from '../src/reactive'
import { isRef, ref, toRef } from '../src/ref'

describe('reactivity/ref', () => {
  test('should hold a value', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
    a.value = 2
    expect(a.value).toBe(2)
  })

  test('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(calls).toBe(2)
  })

  test('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    })
    let dummy
    effect(() => {
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  test('isRef', () => {
    expect(isRef(ref(1))).toBe(true)

    expect(isRef(0)).toBe(false)
    expect(isRef(1)).toBe(false)
    // an object that looks like a ref isn't necessarily a ref
    expect(isRef({ value: 0 })).toBe(false)
  })

  test('toRef', () => {
    const a = reactive({
      x: 1
    })
    const x = toRef(a, 'x')
    expect(isRef(x)).toBe(true)
    expect(x.value).toBe(1)

    // source -> proxy
    a.x = 2
    expect(x.value).toBe(2)

    // proxy -> source
    x.value = 3
    expect(a.x).toBe(3)

    // reactivity
    let dummyX
    effect(() => {
      dummyX = x.value
    })
    expect(dummyX).toBe(x.value)

    // mutating source should trigger effect using the proxy refs
    a.x = 4
    expect(dummyX).toBe(4)

    // should keep ref
    const r = { x: ref(1) }
    expect(toRef(r, 'x')).toBe(r.x)
  })
})
