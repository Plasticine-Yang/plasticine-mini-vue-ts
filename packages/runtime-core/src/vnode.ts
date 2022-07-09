const Text = Symbol()
const Comment = Symbol()
const Fragment = Symbol()

type VNodeTypes = string | typeof Text | typeof Comment | typeof Fragment

type VNodeProps = {
  [key: string]: any
}

export interface VNode {
  type: VNodeTypes
  props: VNodeProps
  children: string | any[]
}
