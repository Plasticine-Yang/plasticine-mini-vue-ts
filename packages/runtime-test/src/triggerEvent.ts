import { isArray } from '@plasticine-mini-vue-ts/shared'
import { TestElement } from './nodeOps'

export function triggerEvent(
  el: TestElement,
  event: string,
  payload: any[] = []
) {
  const { eventListeners } = el
  if (eventListeners) {
    // 取出所有事件依次执行
    const listener = eventListeners[event]
    if (listener) {
      if (isArray(listener)) {
        // 有多个监听回调 -- 依次取出执行
        listener.forEach(cb => cb(...payload))
      } else {
        // 只有一个回调 -- 直接执行
        listener(...payload)
      }
    }
  }
}
