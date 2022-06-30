import { mutableHandlers } from './baseHandlers'

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
