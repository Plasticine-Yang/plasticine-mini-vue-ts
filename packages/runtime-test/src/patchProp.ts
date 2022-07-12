import { TestElement } from './nodeOps'

export function patchProp(
  el: TestElement,
  key: string,
  prevValue: any,
  nextValue: any
) {
  el.props[key] = nextValue
}
