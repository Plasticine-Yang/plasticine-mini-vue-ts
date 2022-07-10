import {
  createRenderer,
  Renderer,
  RootRenderFunction
} from '@plasticine-mini-vue-ts/runtime-core'
import { nodeOps } from './nodeOps'

// 自定义渲染器接口的实现对象 -- 作为参数传递给 createRenderer
const rendererOptions = nodeOps

let renderer: Renderer<Element>

function ensureRenderer() {
  return renderer || (renderer = createRenderer<Node, Element>(rendererOptions))
}

export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<Element>
