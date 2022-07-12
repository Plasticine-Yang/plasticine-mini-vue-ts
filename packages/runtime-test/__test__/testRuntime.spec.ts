import { nodeOps, NodeTypes, TestElement, TestText } from '../src/nodeOps'
import { h, ref, render } from '../src'
import { triggerEvent } from '../src/triggerEvent'

describe('test renderer', () => {
  test('should work', () => {
    const root = nodeOps.createElement('div')
    render(
      h(
        'div',
        {
          id: 'test'
        },
        'hello'
      ),
      root
    )

    expect(root.children.length).toBe(1)

    const el = root.children[0] as TestElement
    expect(el.type).toBe(NodeTypes.ELEMENT)
    expect(el.props.id).toBe('test')
    expect(el.children.length).toBe(1)

    const text = el.children[0] as TestText
    expect(text.type).toBe(NodeTypes.TEXT)
    expect(text.text).toBe('hello')
  })

  test('should be able to trigger events', () => {
    const count = ref(0)
    const root = nodeOps.createElement('div')

    render(
      h(
        'span',
        {
          onClick: () => {
            count.value++
          }
        },
        count.value
      ),
      root
    )

    triggerEvent(root.children[0] as TestElement, 'click')
    expect(count.value).toBe(1)
  })
})
