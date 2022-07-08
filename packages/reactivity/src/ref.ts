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

function isRef(r: any): r is Ref {
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
