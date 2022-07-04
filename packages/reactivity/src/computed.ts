import { effect, ReactiveEffect } from './effect'

export interface ComputedRef<T = any> {
  readonly value: T
}

export type ComputedGetter<T> = (...args: any[]) => T

class ComputedRefImpl<T> {
  // 缓存值
  private _value!: T
  public readonly effect: ReactiveEffect<T>
  // dirty 标志，用来标识是否需要重新计算缓存值，为 true 意味着“脏”，需要重新计算
  public _dirty = true

  constructor(getter: ComputedGetter<T>) {
    // 把 getter 作为副作用函数，创建一个 ReactiveEffect 来管理它
    this.effect = new ReactiveEffect(getter, () => {
      // 使用调度器来更新 dirty
      // 只要 effectedGetter 重新执行，就说明相关的响应式对象已经发生变化
      // 所以数据肯定变成“脏”的了，但是并不需要立即执行 getter 获取新的计算属性值
      // 因为 getter 的更新也要是懒执行的才行
      this._dirty = true
    })
  }

  get value() {
    // 只有缓存值是“脏”的时候才需要重新计算，并更新缓存值
    if (this._dirty) {
      this._value = this.effect.run()
      // 将 dirty 置为 false，表示当前数据已是最新的，不是“脏”的
      this._dirty = false
    }

    return this._value
  }
}

/**
 * 计算属性具有以下三个特性：
 * 1. lazy 懒执行，定义计算属性的时候不会执行 getter，只有当首次访问计算属性的值的时候才会执行 getter
 * 2. 不会重复计算，只要计算属性的 getter 中涉及到的响应式对象没有发生变化，就不会重新执行 getter 进行计算
 *    相当于有一个缓存的功能
 * 3. 计算属性的更新也是懒执行的，当修改计算属性中 getter 中涉及的响应式对象的值时，并不会立刻让计算属性重新计算
 *    而是等用到的时候才计算
 *
 * @param getter 计算属性 getter
 */
export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>
export function computed<T>(getter: ComputedGetter<T>) {
  const cRef = new ComputedRefImpl(getter)

  return cRef as any
}
