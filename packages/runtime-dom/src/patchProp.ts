import { RendererOptions } from '@plasticine-mini-vue-ts/runtime-core'

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
  if (key in el) {
    // 用 in 操作符判断 key 是否存在对应的 DOM Properties
    const type = typeof (el as any)[key]
    if (type === 'boolean' && nextValue === '') {
      // 如果是布尔值 则需要考虑下面这种情况
      // <button disabled></button>
      // 这种情况下得到的 key 是 'disabled'，nextValue 是 ''
      // 如果直接用 el[key] = nextValue，则结果会是 'disabled': ''
      // '' 转成布尔值会是 false，相当于 'disabled': false
      // 而实际上我们希望得到的是 'disabled': true
      // 所以要对布尔类型的 DOM Properties 进行特殊处理
      ;(el as any)[key] = true
    } else {
      ;(el as any)[key] = nextValue
    }
  } else {
    // 没有对应的 DOM Properties 就是用 setAttribute 方法进行设置
    el.setAttribute(key, nextValue)
  }
}
