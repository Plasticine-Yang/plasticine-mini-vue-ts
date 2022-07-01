import { mutableHandlers } from './baseHandlers'

/**
 * @description 响应式对象的类型
 */
export const enum ReactiveFlags {
  RAW = '__v_raw'
}

/**
 * @description 代理对象接口
 */
export interface Target {
  [ReactiveFlags.RAW]?: any
}

/**
 * @description 将普通对象包装成响应式对象
 *
 * 泛型 T 是原始对象的类型
 *
 * @param target 原始对象
 */
export function reactive<T extends object>(target: T): T
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers)
}

/**
 * @description 封装创建响应式对象的逻辑
 * @param target 代理的原始对象
 * @param baseHandlers 使用的 ProxyHandler
 * @returns 响应式对象
 */
function createReactiveObject(target: object, baseHandlers: ProxyHandler<any>) {
  const proxy = new Proxy(target, baseHandlers)

  return proxy
}

/**
 * @description 获取代理对象的原始对象
 * @param observed 代理对象
 */
export function toRaw<T>(observed: T): T {
  // 尝试获取代理对象的 RAW 属性，如果能获取到就已经得到了原始对象
  const raw = observed && (observed as Target)[ReactiveFlags.RAW]
  // 如果获取到原始对象，则递归地获取原始对象的原始对象，因为获取到的原始对象
  // 可能仍然是代理对象，递归地获取直到不存在 RAW 原始对象
  return raw ? toRaw(raw) : observed
}
