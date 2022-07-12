import {
  createRenderer,
  RootRenderFunction
} from '@plasticine-mini-vue-ts/runtime-core'
import { extend } from '@plasticine-mini-vue-ts/shared'
import { nodeOps, TestElement } from './nodeOps'
import { patchProp } from './patchProp'

const { render: baseRender } = createRenderer(extend({ patchProp }, nodeOps))

export const render = baseRender as RootRenderFunction<TestElement>

export * from './nodeOps'
export * from '@plasticine-mini-vue-ts/runtime-core'
