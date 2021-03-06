import { RendererNode } from './renderer'

const Text = Symbol()
const Comment = Symbol()
const Fragment = Symbol()

type VNodeTypes = string | typeof Text | typeof Comment | typeof Fragment

type VNodeProps = {
  [key: string]: any
}

export interface VNode<HostNode = RendererNode> {
  type: VNodeTypes
  props: VNodeProps
  children: string | any[]
  el: HostNode | null
}

// 判断两个 vnode 是否是相同类型
export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type
}

export const createVNode = (
  type: VNodeTypes,
  props: VNodeProps | null = null,
  children: unknown = null
): VNode => {
  const vnode = {
    type,
    props,
    children
  } as VNode

  return vnode
}
