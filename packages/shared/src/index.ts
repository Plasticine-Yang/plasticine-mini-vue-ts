export const extend = Object.assign

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)

export const isArray = Array.isArray
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

/**
 * 主要用于判断访问数组对象时的 key 是否是整数 是的话就意味着是以索引的方式访问
 * @param key key
 * @returns key 是否是整数
 */
export const isIntegerKey = (key: unknown) =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key

// 使用 Object.is 判断新旧值是否相同 包括了对 NaN 的判断
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
