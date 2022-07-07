import {
  extend,
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  isSymbol
} from '@plasticine-mini-vue-ts/shared'
import {
  enableTracking,
  ITERATE_KEY,
  pauseTracking,
  track,
  trigger
} from './effect'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { reactive, ReactiveFlags, readonly, Target, toRaw } from './reactive'

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
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const arrayInstrumentations = createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}

  // 重写数组查找方法：includes、indexOf、lastIndexOf
  // 让下面这个场景能够正常工作
  // const obj = {}
  // const arr = reactive([obj])
  // arr.includes(obj) // should be true
  // 如果不重写，arr[0] 中的是 obj 的代理对象，现在用原始对象去进行查找肯定是找不到的
  // 需要先到原始数组中查找，找不到的话再把 obj 的代理对象用 toRaw 转成原始对象后再去查找即可，这就是重写的目的
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      // 先到原数组中查找
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // 原数组中没找到，说明查找的目标是代理对象，那么就把代理对象转成原始对象再查找
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })

  // 重写这些数组原型方法是因为它们会读取和隐式修改数组的 length 属性，而读取 length 属性的时候不应该
  // 进行依赖收集，比如下面这个场景
  // const arr = reactive([])
  // [1] effect(() => arr.push(1))
  // [2] effect(() => arr.push(2))
  // [1] 的执行会触发 length 的读取，从而被作为依赖收集
  // [2] 的执行也会触发 length 的读取，作为依赖被收集，同时还会隐式修改 length 属性，触发 set 拦截
  // 从而导致执行 [1]，类似地，[1] 执行也会触发 set 拦截，执行 [2]
  // 两者一直循环执行，最终导致栈溢出
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking()
      const res = (toRaw(this) as any)[key].apply(this, args)
      enableTracking()

      return res
    }
  })

  return instrumentations
}

/**
 * @description 封装生成 ProxyHandler 的 getter
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 1. 当访问的 key 是 IS_REACTIVE 枚举值时
      //    根据 isReadonly 的值进行判断
      //    只要不是 readonly 就是 reactive
      // 2. 由于 get 拦截函数是在 createGetter 闭包中创建的
      //    所以一直保持着对 isReadonly 参数的访问能力
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow
    } else if (key === ReactiveFlags.RAW) {
      // 需要获取原始对象的时候 需要访问 RAW 属性 -- __v_raw
      return target
    }

    const targetIsArray = isArray(target)

    // 访问数组的 includes、indexOf、lastIndexOf 等查找方法，以及
    // push、pop、shift、unshift、splice 等会隐式修改 length 的方法时，重写这些方法
    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
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

    if (isSymbol(key) && builtInSymbols.has(key)) {
      // 对于内建的 Symbol 属性不应当进行依赖收集
      return res
    }

    if (!isReadonly) {
      // readonly 对象不允许修改属性，所以没必要收集依赖
      // 依赖收集
      track(target, TrackOpTypes.GET, key)
    }

    if (shallow) {
      // 如果不需要嵌套的响应式对象 就直接返回
      return res
    }

    if (isObject(res)) {
      // 如果对象属性，则将其也转成 reactive 对象
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

const set = createSetter()
const shallowSet = createSetter(true)

function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    // 获取旧值用于比较 仅当新旧值不同时才调用 trigger 触发依赖
    let oldValue = (target as any)[key]
    // 对 value 和 oldValue 进行预处理 如果不是 shallow 的话就转成原始值
    if (!shallow) {
      value = toRaw(value)
      oldValue = toRaw(oldValue)
    } else {
      // shllow 模式下，无论 value 是否是 reactive 的都可以直接设置值
    }

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
    // 对于 Symbol 属性来说，不应当追踪那些 js 内建的 Symbol 属性
    // 比如 Symbol.iterator 这种内建属性
    // 这是为了避免发生意外的错误以及出于性能上的考虑
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

export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  },
  deleteProperty(target, key) {
    console.warn(
      `Delete operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  }
}

export const shallowReactiveHandlers = extend({}, mutableHandlers, {
  get: shallowGet,
  set: shallowSet
})

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
})
