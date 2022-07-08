import { hasChanged } from '@plasticine-mini-vue-ts/shared'
import { createDep, Dep } from './dep'
import { trackEffects, triggerEffects } from './effect'
import { toRaw, toReactive } from './reactive'

declare const RefSymbol: unique symbol

interface Ref<T = any> {
  value: T
  [RefSymbol]: true
}

/**
 * 为了屏蔽 RefImpl 内部细节而定义的类型 只暴露需要用到的属性
 */
type RefBase<T> = {
  value: T
}

export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}

export function ref<T = any>(value: T): Ref<T>
export function ref(value: unknown) {
  if (isRef(value)) {
    return value
  }

  return createRef(value)
}

function createRef(rawRalue: unknown) {
  return new RefImpl(rawRalue)
}

class RefImpl<T> {
  // 如果是对象的话 _value 是响应式对象 _rawValue 记录原始对象
  private _value: T
  private _rawValue: T

  public dep?: Dep
  public readonly __v_isRef = true

  constructor(value: T) {
    // _rawValue 记录原始对象 _value 记录响应式对象
    this._rawValue = value
    this._value = toReactive(value)
  }

  get value() {
    // 收集依赖
    trackEffects(this.dep || (this.dep = createDep()))
    return this._value
  }

  set value(newVal) {
    // 如果传进来的是一个响应式对象 为了能和 this._rawValue 进行比较
    // 需要先转成原始对象才能让 hasChanged 正常工作
    newVal = toRaw(newVal)
    // 仅当值发生改变的时候才触发依赖
    if (hasChanged(newVal, this._rawValue)) {
      // 更新 value -- _rawValue 记录原始对象 _value 记录响应式对象
      this._rawValue = newVal
      this._value = toReactive(newVal)

      if (this.dep) {
        // 触发依赖
        triggerEffects(this.dep)
      }
    }
  }
}

class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly __v_isRef = true

  constructor(private readonly _object: T, private readonly _key: K) {}

  get value() {
    return this._object[this._key]
  }

  set value(newVal) {
    this._object[this._key] = newVal
  }
}

type ToRef<T> = Ref<T>

/**
 * 将响应式对象的属性转成 ref，用于将属性脱离响应式对象时仍能保持响应式的特性
 * @param object 响应式对象
 * @param key 属性
 */
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): ToRef<T[K]> {
  const val = object[key]
  return isRef(val) ? val : (new ObjectRefImpl(object, key) as any)
}

type ToRefs<T = any> = {
  [K in keyof T]: ToRef<T[K]>
}

/**
 * 批量将响应式对象的属性转成 ref，这在 setup 中返回需要在模板中使用的响应式对象的属性时特别有用
 * 比如有一个响应式对象 const obj = reactive({ foo: 1, bar: 2, baz: 3 })
 * 现在希望在模板中使用 foo bar baz 三个变量，如果不将它们脱离出来，那么只能在
 * setup 中直接返回 obj，然后在模板中通过 {{ obj.foo }} 这样的方式使用
 * 而有了 toRefs 后，就可以在 setup 中这样返回：return { ...toRefs(obj) }
 * 这样一来在模板中就可以直接使用了 -- {{ foo }}
 * @param object 响应式对象
 */
export function toRefs<T extends object>(object: T): ToRefs<T> {
  const ret: any = {}
  for (const key in object) {
    ret[key] = toRef(object, key)
  }

  return ret
}

export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? (ref.value as any) : ref
}
