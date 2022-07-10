import { RendererOptions } from '@plasticine-mini-vue-ts/runtime-core'

const doc = (typeof document !== 'undefined' ? document : null) as Document

/**
 * DOM 环境下实现 runtime-core 自定义渲染器接口
 */
export const nodeOps: RendererOptions<Node, Element> = {
  createElement(tag): Element {
    const el = doc.createElement(tag)

    return el
  },

  setElementText(el, text) {
    el.textContent = text
  },

  insert(child, parent) {
    parent.appendChild(child)
  }
}
