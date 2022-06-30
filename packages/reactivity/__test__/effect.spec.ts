import { effect } from '../src/index'

describe('reactivity/effect', () => {
  test('should run the passed function once (wrapped by a effect)', () => {
    const fnSpy = jest.fn(() => {})
    effect(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })
})
