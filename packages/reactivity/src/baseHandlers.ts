import {
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  isSymbol
} from '@plasticine-mini-vue-ts/shared'
import { ITERATE_KEY, track, trigger } from './effect'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { reactive, ReactiveFlags } from './reactive'

// 由于 ios10.x 以上的版本中 Object.getOwnPropertyNames(Symbol) 是可以枚举 'arguments' 和 'caller' 的
// 但是通过 Symbol.arguments 或 Symbol.caller 访问在 JS 的严格模式下是不允许的
// 这里为了遵循 JS 的规范，需要将内建的 Symbol 属性屏蔽掉
const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .filter(key => key !== 'arguments' && key !== 'caller')
    .map(key => (Symbol as any)[key])
    .filter(isSymbol)
)

// ProxyHandler 的 get 拦截
const get = createGetter()

/**
 * @description 封装生成 ProxyHandler 的 getter
 */
function createGetter(shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.RAW) {
      // 需要获取原始对象的时候 需要访问 RAW 属性 -- __v_raw
      return target
    }
    // 使用 Reflect.get 而不是直接 target[key] 有两个原因:
    // 1. 能够使用 receiver 处理访问器属性中的 this 指向问题
    //    如果访问器属性中通过 this 访问了对象的别的属性，由于
    //    访问的不是代理对象而是原始对象，导致无法触发代理对象的
    //    get 拦截，从而导致无法进行依赖收集
    // 2. 使代码更加语义化
    // PS: 访问器属性就是对象中通过 get xxx() {} 方式定义的属性，比如：
    // const foo = {
    //   bar: 1,
    //   get baz() {
    //     return this.bar
    //   }
    // }
    const res = Reflect.get(target, key, receiver)

    // 依赖收集
    track(target, TrackOpTypes.GET, key)

    if (shallow) {
      // 如果不需要嵌套的响应式对象 就直接返回
      return res
    }

    if (isObject(res)) {
      // 如果对象属性，则将其也转成 reactive 对象
      return reactive(res)
    }

    return res
  }
}

const set = createSetter()

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    // 获取旧值用于比较 仅当新旧值不同时才调用 trigger 触发依赖
    let oldValue = (target as any)[key]
    // 判断 target 是否已有 key
    // 已有则是 SET 语义
    // 未有则是 ADD 语义
    const hadKey =
      // 如果是数组 则 key 是索引，当尝试对超出数组长度的索引设置值时
      // 会修改数组的 length 属性，这是一个 ADD 语义
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : // 如果不是数组 就判断 key 是否是 target 自身已有的 不是的话应当走 ADD 语义
          hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)

    if (!hadKey) {
      // target 原本没有 key --> 以 ADD 语义触发依赖
      trigger(target, TriggerOpTypes.ADD, key, value)
    } else if (hasChanged(value, oldValue)) {
      // target 原本就有 key --> 以 SET 语义触发依赖
      trigger(target, TriggerOpTypes.SET, key, value)
    }

    return result
  }
}

/**
 * @description 监控删除响应式对象属性时触发依赖
 * @param target 函数依赖的目标对象
 * @param key 目标对象的 key
 */
function deleteProperty(target: object, key: string | symbol): boolean {
  // 检查 key 是否在 target 中存在
  // 是的话删除 key 之后会导致 target 的属性数量减少
  // 会影响 for in 循环的结果
  const hadKey = hasOwn(target, key)
  // 删除属性
  const result = Reflect.deleteProperty(target, key)

  if (result && hadKey) {
    // 只有当被删除的属性是 target 自身的时候才会触发依赖
    trigger(target, TriggerOpTypes.DELETE, key)
  }

  return result
}

/**
 * @description 当使用 in 操作符判断对象是否拥有某个属性时 进行依赖收集
 * @param target 函数依赖的目标对象
 * @param key 目标对象的 key
 */
function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key)
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, TrackOpTypes.HAS, key)
  }

  return result
}

function ownKeys(target: object): (string | symbol)[] {
  track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY)
  return Reflect.ownKeys(target)
}

// 处理可变对象的 ProxyHandler
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
