import { createVNode, VNode } from './vnode'

// 给用户使用的创建 vnode 的函数
export function h(type: any, props: any, children: any): VNode {
  return createVNode(type, props, children)
}
