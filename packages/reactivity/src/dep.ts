import { ReactiveEffect } from './effect'

export type Dep = Set<ReactiveEffect>

/**
 * @description 创建副作用函数对象集合
 * @param effects ReactiveEffect 副作用函数对象数组
 * @returns 副作用函数对象集合
 */
export const createDep = (effects?: ReactiveEffect[]): Dep => {
  const dep = new Set<ReactiveEffect>(effects)

  return dep
}
