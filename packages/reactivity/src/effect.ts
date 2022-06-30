/**
 * @description 处理副作用函数
 * @param fn effectFn 副作用函数
 */
export function effect<T = any>(fn: () => T) {
  fn()
}
