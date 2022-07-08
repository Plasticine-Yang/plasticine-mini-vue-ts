import { createDep, Dep } from './dep'
import { trackEffects, triggerEffects } from './effect'

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

export function ref<T = any>(value: T): Ref<T | undefined>
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
  private _value: T

  public dep?: Dep
  public readonly __v_isRef = true

  constructor(value: T) {
    this._value = value
  }

  get value() {
    // 收集依赖
    trackEffects(this.dep || (this.dep = createDep()))
    return this._value
  }

  set value(newVal) {
    this._value = newVal

    if (this.dep) {
      // 触发依赖
      triggerEffects(this.dep)
    }
  }
}
