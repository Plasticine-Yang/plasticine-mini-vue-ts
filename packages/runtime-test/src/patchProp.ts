import { isOn } from '@plasticine-mini-vue-ts/shared'
import { TestElement } from './nodeOps'

export function patchProp(
  el: TestElement,
  key: string,
  prevValue: any,
  nextValue: any
) {
  el.props[key] = nextValue
  // 如果是事件监听属性则将对应的事件添加到对应的事件监听回调列表中
  if (isOn(key)) {
    // 获取事件名 -- 比如 onClick 会被转换成 click
    const event = key.slice(2).toLowerCase()
    // 事件监听器
    ;(el.eventListeners || (el.eventListeners = {}))[event] = nextValue
  }
}
