import { effect, reactive } from '../src/index'
import { toRaw } from '../src/reactive'

describe('reactivity/effect', () => {
  test('should run the passed function once (wrapped by a effect)', () => {
    const fnSpy = jest.fn(() => {})
    effect(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })

  test('should observe basic properties', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    counter.num = 7
    expect(dummy).toBe(7)
  })

  test('should observe multiple properties', () => {
    let dummy
    const counter = reactive({ num1: 0, num2: 0 })
    effect(() => (dummy = counter.num1 + counter.num1 + counter.num2))

    expect(dummy).toBe(0)
    counter.num1 = counter.num2 = 7
    expect(dummy).toBe(21)
  })

  test('should handle multiple effects', () => {
    let dummy1, dummy2
    const counter = reactive({ num: 0 })
    effect(() => (dummy1 = counter.num))
    effect(() => (dummy2 = counter.num))

    expect(dummy1).toBe(0)
    expect(dummy2).toBe(0)
    counter.num++
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(1)
  })

  test('should observe nested properties', () => {
    let dummy
    const counter = reactive({ nested: { num: 0 } })
    effect(() => (dummy = counter.nested.num))

    expect(dummy).toBe(0)
    counter.nested.num = 8
    expect(dummy).toBe(8)
  })

  test('should observe delete operations', () => {
    let dummy
    const obj = reactive<{
      prop?: string
    }>({ prop: 'value' })
    effect(() => (dummy = obj.prop))

    expect(dummy).toBe('value')
    delete obj.prop
    expect(dummy).toBe(undefined)
  })

  test('should observe has operations', () => {
    let dummy
    const obj = reactive<{
      prop?: string | number
    }>({ prop: 'value' })
    effect(() => (dummy = 'prop' in obj))

    expect(dummy).toBe(true)
    delete obj.prop
    expect(dummy).toBe(false)
    obj.prop = 12
    expect(dummy).toBe(true)
  })

  test('should observe properties on the prototype chain', () => {
    let dummy
    const counter = reactive<{ num?: number }>({ num: 0 })
    const parentCounter = reactive<{ num: number }>({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    delete counter.num
    expect(dummy).toBe(2)
    parentCounter.num = 4
    expect(dummy).toBe(4)
    counter.num = 3
    expect(dummy).toBe(3)
  })

  test('should observe has operations on the prototype chain', () => {
    let dummy
    const counter = reactive<{ num?: number }>({ num: 0 })
    const parentCounter = reactive<{ num?: number }>({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    effect(() => (dummy = 'num' in counter))

    expect(dummy).toBe(true)
    delete counter.num
    expect(dummy).toBe(true)
    delete parentCounter.num
    expect(dummy).toBe(false)
    counter.num = 3
    expect(dummy).toBe(true)
  })

  test('should observe inherited property accessors', () => {
    let dummy, parentDummy, hiddenValue: any
    const obj = reactive<{ prop?: number }>({})
    const parent = reactive({
      set prop(value: any) {
        hiddenValue = value
      },
      get prop() {
        return hiddenValue
      }
    })
    Object.setPrototypeOf(obj, parent)

    effect(() => (dummy = obj.prop))
    effect(() => (parentDummy = parent.prop))
    obj.prop = 4
    expect(dummy).toBe(4)
    parent.prop = 2
    expect(dummy).toBe(2)
    expect(parentDummy).toBe(2)
  })

  test('should observe function call chains', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = getNum()))

    function getNum() {
      return counter.num
    }

    expect(dummy).toBe(0)
    counter.num = 2
    expect(dummy).toBe(2)
  })

  // test('should observe iteration', () => {
  //   let dummy
  //   const list = reactive(['Hello'])
  //   effect(() => (dummy = list.join(' ')))

  //   expect(dummy).toBe('Hello')
  //   list.push('World!')
  //   expect(dummy).toBe('Hello World!')
  //   list.shift()
  //   expect(dummy).toBe('World!')
  // })

  test('should observe implicit array length changes', () => {
    let dummy
    const list = reactive(['Hello'])
    effect(() => (dummy = list.join(' ')))

    expect(dummy).toBe('Hello')
    list[1] = 'World!'
    expect(dummy).toBe('Hello World!')
    list[3] = 'Hello!'
    expect(dummy).toBe('Hello World!  Hello!')
  })

  // sparse: adj. ?????????
  // test('should observe sparse array mutations', () => {
  //   let dummy
  //   const list = reactive<string[]>([])
  //   list[1] = 'World!'
  //   effect(() => (dummy = list.join(' ')))

  //   expect(dummy).toBe(' World!')
  //   list[0] = 'Hello'
  //   expect(dummy).toBe('Hello World!')
  //   list.pop()
  //   expect(dummy).toBe('Hello')
  // })

  test('should observe enumeration', () => {
    let dummy
    const numbers = reactive<Record<string, number>>({ num1: 3 })
    effect(() => {
      dummy = 0
      for (const key in numbers) {
        dummy += numbers[key]
      }
    })

    expect(dummy).toBe(3)
    numbers.num2 = 4
    expect(dummy).toBe(7)
    delete numbers.num1
    expect(dummy).toBe(4)
  })

  test('should observe symbol keyed properties', () => {
    const key = Symbol('symbol keyed prop')
    let dummy, hasDummy
    const obj = reactive<{ [key]?: string }>({ [key]: 'value' })
    effect(() => (dummy = obj[key]))
    effect(() => (hasDummy = key in obj))

    expect(dummy).toBe('value')
    expect(hasDummy).toBe(true)
    obj[key] = 'newValue'
    expect(dummy).toBe('newValue')
    delete obj[key]
    expect(dummy).toBe(undefined)
    expect(hasDummy).toBe(false)
  })

  test('should not observe well-known symbol keyed properties', () => {
    const key = Symbol.isConcatSpreadable
    let dummy
    const array: any = reactive([])
    effect(() => (dummy = array[key]))

    expect(array[key]).toBe(undefined)
    expect(dummy).toBe(undefined)
    array[key] = true
    expect(array[key]).toBe(true)
    expect(dummy).toBe(undefined)
  })

  test('should observe function valued properties', () => {
    const oldFunc = () => {}
    const newFunc = () => {}

    let dummy
    const obj = reactive({ func: oldFunc })
    effect(() => (dummy = obj.func))

    expect(dummy).toBe(oldFunc)
    obj.func = newFunc
    expect(dummy).toBe(newFunc)
  })

  /**
   * ????????? set ??? get ?????????????????? Reflect ????????? receiver ??????
   * ??????????????????????????? b ?????? this ????????????????????????????????? a
   */
  test('should observe chained getters relying on this', () => {
    const obj = reactive({
      a: 1,
      get b() {
        return this.a
      }
    })

    let dummy
    effect(() => (dummy = obj.b))
    expect(dummy).toBe(1)
    obj.a++
    expect(dummy).toBe(2)
  })

  test('should observe methods relying on this', () => {
    const obj = reactive({
      a: 1,
      b() {
        return this.a
      }
    })

    let dummy
    effect(() => (dummy = obj.b()))
    expect(dummy).toBe(1)
    obj.a++
    expect(dummy).toBe(2)
  })

  test('should not observe set operations without a value change', () => {
    let hasDummy, getDummy
    const obj = reactive({ prop: 'value' })

    const getSpy = jest.fn(() => (getDummy = obj.prop))
    const hasSpy = jest.fn(() => (hasDummy = 'prop' in obj))
    effect(getSpy)
    effect(hasSpy)

    expect(getDummy).toBe('value')
    expect(hasDummy).toBe(true)
    obj.prop = 'value'
    expect(getSpy).toHaveReturnedTimes(1)
    expect(hasSpy).toHaveBeenCalledTimes(1)
    expect(getDummy).toBe('value')
    expect(hasDummy).toBe(true)
  })

  test('should not observe raw mutations', () => {
    let dummy
    const obj = reactive<{ prop?: string }>({})
    effect(() => (dummy = toRaw(obj).prop))

    expect(dummy).toBe(undefined)
    obj.prop = 'value'
    expect(dummy).toBe(undefined)
  })

  test('should not be triggered by inherited raw setters', () => {
    let dummy, parentDummy, hiddenValue: any
    const obj = reactive<{ prop?: number }>({})
    const parent = reactive({
      set prop(value) {
        hiddenValue = value
      },
      get prop() {
        return hiddenValue
      }
    })
    Object.setPrototypeOf(obj, parent)
    effect(() => (dummy = obj.prop))
    effect(() => (parentDummy = parent.prop))

    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
    toRaw(obj).prop = 4
    expect(dummy).toBe(undefined)
    expect(parentDummy).toBe(undefined)
  })

  test('should not be triggered by raw mutations', () => {
    let dummy
    const obj = reactive<{ prop?: string }>({})
    effect(() => (dummy = obj.prop))

    expect(dummy).toBe(undefined)
    toRaw(obj).prop = 'value'
    expect(dummy).toBe(undefined)
  })

  test('should not be triggered by mutating a property, which is used in a inactive branch', () => {
    let dummy
    const obj = reactive({ prop: 'value', run: true })

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : 'other'
    })
    effect(conditionalSpy)

    expect(dummy).toBe('value')
    expect(conditionalSpy).toHaveBeenCalledTimes(1)
    obj.run = false
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
    obj.prop = 'value2'
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
  })

  // ???????????? effect ??????????????? effect ????????? activeEffect
  // ??????????????????????????????????????? effect ?????????????????????????????????????????????
  // ???????????? effectStack ???????????????????????????
  test('effect ??????', () => {
    let dummy1, dummy2
    const obj = reactive({ foo: true, bar: true })
    const effectFn2Spy = jest.fn(() => (dummy1 = obj.bar)).mockName('fn2')
    const effectFn1Spy = jest
      .fn(() => {
        effect(effectFn2Spy)
        dummy2 = obj.foo
      })
      .mockName('fn1')
    effect(effectFn1Spy)

    expect(dummy1).toBe(true)
    expect(dummy2).toBe(true)
    expect(effectFn1Spy).toHaveBeenCalledTimes(1)
    expect(effectFn2Spy).toHaveBeenCalledTimes(1)
    obj.foo = false
    expect(dummy2).toBe(false)
    expect(effectFn1Spy).toHaveBeenCalledTimes(2)
    expect(effectFn2Spy).toHaveBeenCalledTimes(2)
  })

  test('effect???????????????get???set????????????????????????????????????', () => {
    const obj = reactive({ foo: 1 })
    effect(() => obj.foo++)
    expect(obj.foo).toBe(2)
  })

  test('effect??????????????????runner??????????????????effect??????????????????', () => {
    const obj = reactive({ foo: 1 })
    const runner = effect(() => obj.foo++)

    expect(obj.foo).toBe(2)
    expect(typeof runner).toBe('function')
    runner()
    expect(obj.foo).toBe(3)
  })

  test('scheduler', () => {
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    // should not run yet
    expect(dummy).toBe(1)
    // manually run
    run()
    // should have run
    expect(dummy).toBe(2)
  })

  test('lazy', () => {
    let dummy
    const obj = reactive({ foo: 1 })
    const runner = effect(() => (dummy = obj.foo), { lazy: true })

    expect(dummy).toBe(undefined)
    expect(runner()).toBe(1)
    expect(dummy).toBe(1)
    obj.foo = 2
    expect(dummy).toBe(2)
  })

  // test('should trigger all effects when array length is set to 0', () => {
  //   const observed: any = reactive([1])
  //   let dummy, record
  //   effect(() => {
  //     dummy = observed.length
  //   })
  //   effect(() => {
  //     record = observed[0]
  //   })
  //   expect(dummy).toBe(1)
  //   expect(record).toBe(1)

  //   observed[1] = 2
  //   expect(observed[1]).toBe(2)
  //   expect(dummy).toBe(2)
  //   expect(record).toBe(1)

  //   observed.unshift(3)
  //   expect(dummy).toBe(3)
  //   expect(record).toBe(3)

  //   observed.length = 0
  //   expect(dummy).toBe(0)
  //   expect(record).toBeUndefined()
  // })

  test('should avoid infinite recursive loops when use Array.prototype.push/unshift/pop/shift', () => {
    ;(['push', 'unshift'] as const).forEach(key => {
      const arr = reactive<number[]>([])
      const counterSpy1 = jest.fn(() => (arr[key] as any)(1))
      const counterSpy2 = jest.fn(() => (arr[key] as any)(2))
      effect(counterSpy1)
      effect(counterSpy2)
      expect(arr.length).toBe(2)
      expect(counterSpy1).toHaveBeenCalledTimes(1)
      expect(counterSpy2).toHaveBeenCalledTimes(1)
    })
    ;(['pop', 'shift'] as const).forEach(key => {
      const arr = reactive<number[]>([1, 2, 3, 4])
      const counterSpy1 = jest.fn(() => (arr[key] as any)())
      const counterSpy2 = jest.fn(() => (arr[key] as any)())
      effect(counterSpy1)
      effect(counterSpy2)
      expect(arr.length).toBe(2)
      expect(counterSpy1).toHaveBeenCalledTimes(1)
      expect(counterSpy2).toHaveBeenCalledTimes(1)
    })
  })
})
