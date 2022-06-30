import { track, trigger } from './effect'

// ProxyHandler 的 get 拦截
const get = createGetter()

/**
 * @description 封装生成 ProxyHandler 的 getter
 */
function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    // 依赖收集
    track(target, key)

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
    return Reflect.get(target, key, receiver)
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
    const result = Reflect.set(target, key, value, receiver)

    // 触发依赖
    trigger(target, key)

    return result
  }
}

// 处理可变对象的 ProxyHandler
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set
}
