import { RendererOptions } from '@plasticine-mini-vue-ts/runtime-core'
import { patchAttr } from './modules/attrs'
import { patchDOMProp } from './modules/props'

type DOMRendererOptions = RendererOptions<Node, Element>

/**
 * 对于元素属性的设置，分为 HTML Attributes 和 DOM Properties
 *
 * HTML Attributes 是 html 标签上的键值对属性
 * 在 DOM 中通过 el.setAttribute(key, val) 进行设置
 * 比如 el.setAttribute('disabled', 'false')
 *
 * DOM Properties 则是直接通过修改 DOM 元素的属性值实现
 * 比如 el.disabled = false
 * 也就是说判断一个 key 是否是 DOM Properties 只需要使用 in 操作符即可
 * 比如 'disabled' in el
 *
 * 为了让属性正确设置，需要根据不同情况交给 patchDOMProp 和 patchAttr 去处理
 */
export const patchProp: DOMRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue
) => {
  if (shouldSetAsProp(el, key)) {
    // 以 DOM Properties 的方式处理元素属性
    patchDOMProp(el, key, nextValue)
  } else {
    // 没有对应的 DOM Properties 就是用 setAttribute 方法进行设置
    patchAttr(el, key, nextValue)
  }
}

/**
 * @description 判断是否要将 key 作为 DOM Properties 去处理
 */
function shouldSetAsProp(el: Element, key: string) {
  // 用 in 操作符判断 key 是否存在对应的 DOM Properties
  return key in el
}
