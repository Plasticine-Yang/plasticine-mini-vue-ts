import { isFunction, isObject } from '@plasticine-mini-vue-ts/shared'
import { ReactiveEffect } from './effect'

export type WatchCallback<V = any> = (value: V, oldValue?: V) => any

interface WatchOptions<Immediate = boolean> {
  // 是否立即执行 watch 回调
  immediate?: Immediate
}

const INITIAL_WATCHER_VALUE = {}

// Immediate 泛型限制为 Readonly
export function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T,
  cb: WatchCallback<T>,
  options?: WatchOptions<Immediate>
) {
  let getter: () => any
  let oldValue = INITIAL_WATCHER_VALUE

  // 提取 scheduler 为一个独立的 job 函数
  const schedulerJob = () => {
    // 调度器中重新执行 effectFn 得到的就是新值
    const newValue = effect.run()
    // 数据变化的时候调用传入的回调
    cb(newValue as T, oldValue as unknown as T)
    // 更新旧值，让新值成为下一次的旧值
    oldValue = newValue as T
  }

  // getter 预处理 -- 要能够同时处理对整个对象和对部分属性的监听
  if (isFunction(source)) {
    // source 是以 getter 的方式传入
    getter = () => source()
  } else {
    getter = () => traverse(source)
  }

  // 通过 effect 建立与 source 的依赖，需要遍历 source 的所有属性建立依赖
  const effect = new ReactiveEffect(getter, schedulerJob)

  if (options?.immediate) {
    // 开启了 immediate 的话就立即执行回调
    // 立即执行回调的时候，不存在旧值，所以会是 undefined
    schedulerJob()
  } else {
    // 手动调用副作用函数，得到的值就是旧值
    oldValue = effect.run() as T
  }
}

/**
 * 用于递归遍历对象的所有属性，通过 effect 建立依赖
 * @param value 对象
 * @param seen 记录属性是否已被遍历过，避免循环引用导致死循环
 */
export function traverse(value: unknown, seen?: Set<unknown>) {
  // 不是对象则直接返回
  if (!isObject(value)) return value
  // 初始化 seen 集合
  seen = seen || new Set()
  // 已经遍历过则不需要遍历
  if (seen.has(value)) return value
  // 将数据添加到 seen 中表示已经读取过了，避免循环引用引起死循环
  seen.add(value)

  // 只考虑对象 暂时不考虑 Array、Set 等数据结构
  for (const key in value) {
    traverse((value as any)[key], seen)
  }

  return value
}
