/**
 * @description 以 DOM Properties 的方式更新元素属性
 */
export function patchDOMProp(el: any, key: string, value: any) {
  const type = typeof (el as any)[key]
  if (type === 'boolean' && value === '') {
    // 如果是布尔值 则需要考虑下面这种情况
    // <button disabled></button>
    // 这种情况下得到的 key 是 'disabled'，value 是 ''
    // 如果直接用 el[key] = value，则结果会是 'disabled': ''
    // '' 转成布尔值会是 false，相当于 'disabled': false
    // 而实际上我们希望得到的是 'disabled': true
    // 所以要对布尔类型的 DOM Properties 进行特殊处理
    ;(el as any)[key] = true
  } else {
    ;(el as any)[key] = value
  }
}
