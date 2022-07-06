import { mutableHandlers, shallowReactiveHandlers } from './baseHandlers'

/**
 * @description 响应式对象的类型
 */
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw'
}

/**
 * @description 代理对象接口
 */
export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

// reactive 对象缓存表 对同一个原始对象多次创建 reactive 对象时
// 会进行缓存，如果已经存在则没必要再次创建，直接返回缓存结果
export const reactiveMap = new WeakMap<Target, any>()
export const shallowReactiveMap = new WeakMap<Target, any>()

/**
 * @description 将普通对象包装成响应式对象
 *
 * 泛型 T 是原始对象的类型
 *
 * @param target 原始对象
 */
export function reactive<T extends object>(target: T): T
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

export function shallowReactive<T extends object>(target: T): T {
  return createReactiveObject(
    target,
    shallowReactiveHandlers,
    shallowReactiveMap
  )
}

/**
 * @description 封装创建响应式对象的逻辑
 * @param target 代理的原始对象
 * @param baseHandlers 使用的 ProxyHandler
 * @returns 响应式对象
 */
function createReactiveObject(
  target: Target,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  // target 已经是代理对象，不需要再创建代理对象 直接返回即可
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  // 查找缓存 如果 target 已创建过代理对象，则直接返回缓存结果
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    // 缓存命中 -- 直接返回缓存结果
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)

  // 创建了代理对象后要及时缓存
  proxyMap.set(target, proxy)

  return proxy
}

export function isReactive(value: unknown): boolean {
  // The double exclamation point, or double bang,
  // converts a truthy or falsy value to `true` or `false`
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

export function isShallow(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_SHALLOW])
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
