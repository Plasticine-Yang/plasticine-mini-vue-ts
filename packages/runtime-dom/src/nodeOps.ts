import { RendererOptions } from '@plasticine-mini-vue-ts/runtime-core'

const doc = (typeof document !== 'undefined' ? document : null) as Document

/**
 * DOM 环境下实现 runtime-core 自定义渲染器接口
 *
 * 使用 Omit 将 patchProp 接口排除，因为 patchProp 的实现比较复杂
 * 所以放到单独的一个文件中去实现
 */
export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
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
