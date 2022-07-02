import { isArray, isIntegerKey } from '@plasticine-mini-vue-ts/shared'
import { createDep, Dep } from './dep'
import { TrackOpTypes, TriggerOpTypes } from './operations'

// 建立 target(响应式对象) -> key(对象的 key) -> dep(依赖的副作用函数集合) 映射关系
// 使用 WeakMap 是为了防止用户不需要这个响应式对象的时候，响应式对象无法被 gc 回收的问题
// 因为如果使用的是 Map 作为 targetMap 的话，当用户不需要响应式对象，将引用删除后，
// 由于 targetMap 中保留着对目标对象的引用，导致出现即使用户把对响应式对象的引用删除了
// 也无法被 gc 回收的问题，即内存泄漏
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

// 当前激活的副作用函数对象 -- 在用户角度看来就是当前正在被执行的副作用函数
let activeEffect: ReactiveEffect | undefined

export const ITERATE_KEY = Symbol()

/**
 * 将副作用函数的执行逻辑封装到类中处理，也方便扩展调度器 scheduler 等功能
 */
export class ReactiveEffect<T = any> {
  // 用于反向记录依赖集合，记录副作用函数出现在哪些对象属性的依赖集合中
  // 主要用于解决分支切换，在每次执行副作用函数之前先将所有的依赖集合清空
  // 再在执行副作用函数的时候重新收集依赖，解决分支切换时的依赖残留问题
  deps: Dep[] = []

  constructor(public fn: () => T) {}

  run() {
    // 执行副作用函数之前把其所有的依赖集合清空，防止分支切换的依赖遗留问题
    cleanupEffect(this)

    // 执行副作用函数的时候 让 activeEffect 指向自己 从而能够被作为依赖收集
    activeEffect = this
    this.fn()
  }
}

/**
 * 在副作用函数的反向依赖集合中将副作用函数本身移除
 * @param effect 副作用函数的 ReactiveEffect 对象
 */
function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      // 遍历副作用函数的所有依赖集合，将其自身从这些依赖集合中移除
      deps[i].delete(effect)
    }
    // 移除完毕之后 deps 中没必要再保留这些反向存储的依赖集合引用
    deps.length = 0
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
export function track(target: object, type: TrackOpTypes, key: unknown) {
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

  // 反向记录副作用函数所在的依赖集合，用于分支切换之前进行清理，解决分支切换的依赖遗留问题
  activeEffect?.deps.push(dep)
}

/**
 * @description 触发依赖
 * @param target 以来函数触发的目标对象
 * @param key 触发的目标对象的 key
 */
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key: unknown,
  newValue?: unknown
) {
  // 从 targetMap 中取出 depsMap
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }

  // 存放所有待触发的依赖
  let deps: (Dep | undefined)[] = []

  if (key === 'length' && isArray(target)) {
    // 也就是需要先从 depsMap 中找出:
    // 1. `已经和数组长度关联的副作用函数依赖` -- 即 key 为 length 的依赖
    // 2. const list = reactive(['Hello', 'World!'])
    //    effect(() => (dummy = `${list[0]} the ${list[1]}`))
    //    list[0] = 'Hi'
    //    ==> dummy 应从 'Hello the World!' 变为 'Hi the World!'
    //    此时 depsMap 中的 key 是 0 和 1, 而 newValue 是 0
    //    应当将 key >= newValue 的副作用函数都执行

    // 取出与 length 相关联的依赖添加到 deps 中
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        deps.push(dep)
      }
    })
  } else {
    // 处理 SET | ADD | DELETE
    if (key !== void 0) {
      // key 存在则从 depsMap 中取出相应的依赖添加到待触发依赖 deps 中
      deps.push(depsMap.get(key))
    }

    switch (type) {
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          // 当以 ADD 语义触发依赖时 会影响到 for in 的结果
          // 所以需要把 ITERATE_KEY 对应的依赖执行一遍
          deps.push(depsMap.get(ITERATE_KEY))
        } else if (isIntegerKey(key)) {
          // 当以 ADD 语义触发依赖 并且 target 是数组时
          // 需要执行与 length 属性相关联的副作用函数
          deps.push(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          // 当以 DELETE 语义触发依赖时 会影响到 for in 循环
          // 所以还需要将 ITERATE_KEY 相关联的依赖执行一遍
          deps.push(depsMap.get(ITERATE_KEY))
        }
        break
      case TriggerOpTypes.SET:
        break
    }
  }

  if (deps.length === 1) {
    // 只涉及一个对象的一个属性的依赖
    if (deps[0]) {
      triggerEffects(deps[0])
    }
  } else {
    // 涉及一个对象的多个属性的依赖
    const effects: ReactiveEffect[] = []
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep)
      }
    }

    triggerEffects(createDep(effects))
  }
}

/**
 * @description 遍历每个副作用函数对象 调用它们的 run 方法执行副作用函数 完成触发依赖
 * @param dep 依赖集合
 */
export function triggerEffects(dep: Dep | ReactiveEffect[]) {
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    triggerEffect(effect)
  }
}

function triggerEffect(effect: ReactiveEffect) {
  effect.run()
}
