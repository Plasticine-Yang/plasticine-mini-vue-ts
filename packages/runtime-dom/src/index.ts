import {
  createRenderer,
  Renderer,
  RootRenderFunction
} from '@plasticine-mini-vue-ts/runtime-core'
import { extend } from '@plasticine-mini-vue-ts/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

// 自定义渲染器接口的实现对象 -- 作为参数传递给 createRenderer
// patchProp 的实现比较复杂 所以和 nodeOps 的统一实现分离 但最终使用的时候还需要将它们合并
const rendererOptions = extend({ patchProp }, nodeOps)

let renderer: Renderer<Element>

function ensureRenderer() {
  return renderer || (renderer = createRenderer<Node, Element>(rendererOptions))
}

export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<Element>
