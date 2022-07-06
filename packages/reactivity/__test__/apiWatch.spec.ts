import { watch } from '../src/apiWatch'
import { reactive } from '../src/reactive'

describe('api: watch', () => {
  test('directly watching reactive object', () => {
    let dummy
    const src = reactive({ count: 0 })
    watch(src, ({ count }) => {
      dummy = count
    })
    src.count++
    expect(dummy).toBe(1)
  })
})
