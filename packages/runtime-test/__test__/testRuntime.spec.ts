import { nodeOps, NodeTypes, TestElement, TestText } from '../src/nodeOps'
import { h, render } from '../src'

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
})
