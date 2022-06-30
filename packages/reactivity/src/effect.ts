import { createDep, Dep } from './dep'

// 建立 target(响应式对象) -> key(对象的 key) -> dep(依赖的副作用函数集合) 映射关系
// 使用 WeakMap 是为了防止用户不需要这个响应式对象的时候，响应式对象无法被 gc 回收的问题
// 因为如果使用的是 Map 作为 targetMap 的话，当用户不需要响应式对象，将引用删除后，
// 由于 targetMap 中保留着对目标对象的引用，导致出现即使用户把对响应式对象的引用删除了
// 也无法被 gc 回收的问题，即内存泄漏
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

// 当前激活的副作用函数对象 -- 在用户角度看来就是当前正在被执行的副作用函数
let activeEffect: ReactiveEffect | undefined

/**
 * 将副作用函数的执行逻辑封装到类中处理，也方便扩展调度器 scheduler 等功能
 */
export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}

  run() {
    // 执行副作用函数的时候 让 activeEffect 指向自己 从而能够被作为依赖收集
    activeEffect = this
    this.fn()
  }
}

/**
 * @description 处理副作用函数
 * @param fn effectFn 副作用函数
 */
export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)

  _effect.run()
}

/**
 * @description 依赖收集
 * @param target 进行依赖收集的目标对象
 * @param key 依赖副作用函数所依赖的目标对象的 key
 */
export function track(target: object, key: unknown) {
  // 1. 映射查找过程: target -> key -> dep
  // 从 targetMap 中找到 target 对应的 depsMap
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    // 不存在说明是首次对该对象进行依赖收集，为其创建一个 depsMap
    targetMap.set(target, (depsMap = new Map()))
  }

  // 从 depsMap 中找到 target[key] 对应的依赖副作用函数 ReactiveEffect 对象
  let dep = depsMap.get(key)
  if (!dep) {
    // 不存在说明这个 key 首次被访问，为其创建一个空的副作用函数对象集合
    depsMap.set(key, (dep = createDep()))
  }

  // 2. 将当前激活的副作用函数对象添加到查找到的依赖集合 dep 中
  // 可以断言为不是 undefined，因为能执行 track 就一定是触发了响应式对象的 getter
  // 也就意味着一定是要有副作用函数访问到了响应式对象的属性才会触发
  // 所以 activeEffect 一定会指向那个副作用函数的，也就是不会为 undefined
  dep.add(activeEffect!)
}

/**
 * @description 触发依赖
 * @param target 以来函数触发的目标对象
 * @param key 触发的目标对象的 key
 */
export function trigger(target: object, key: unknown) {
  // 从 targetMap 中取出 depsMap
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }

  // 从 depsMap 中根据 key 取出所有的副作用函数对象
  let effects = depsMap.get(key)
  // 遍历每个副作用函数对象 调用它们的 run 方法执行副作用函数 完成触发依赖
  effects && effects.forEach(effect => effect.run())
}
