/**
 * @description 用于在 node 中模拟浏览器的 DOM 环境 方便进行单元测试
 * nodeOps 意思是 node options
 */

/** 结点类型 -- 和 DOM 中的结点类型对应 */
export const enum NodeTypes {
  TEXT = 'text',
  ELEMENT = 'element',
  COMMENT = 'comment'
}

/** 等价于 DOM 中的 HTMLElement */
export interface TestElement {
  id: number
  // 这个不是 DOM 中的，只是为了方便单元测试识别结点类型
  type: NodeTypes.ELEMENT
  parentNode: TestElement | null
  // 等价于 DOM 中的标签 -- 如 div、p 等
  tag: string
  children: TestNode[]
  // 等价于 DOM 中 Element 的属性，比如 <div name="plasticine"></div>
  props: Record<string, any>
  // 元素的事件监听器，可以是一个也可以是多个，当然 也可以没有
  eventListeners: Record<string, Function | Function[]> | null
}

/** 等价于 DOM 中的文本结点 */
export interface TestText {
  id: number
  type: NodeTypes.TEXT
  parentNode: TestElement | null
  // 文本结点 和 注释节点 特有
  text: string
}

/** 等价于 DOM 中的注释结点 */
export interface TestComment {
  id: number
  type: NodeTypes.COMMENT
  parentNode: TestElement | null
  // 文本结点 和 注释节点 特有
  text: string
}

export interface TestComment {}

type TestNode = TestElement | TestText | TestComment

let nodeId = 0

/** 创建 Element 类型的结点 */
function createElement(tag: string): TestElement {
  const node: TestElement = {
    id: nodeId++,
    type: NodeTypes.ELEMENT,
    tag,
    children: [],
    props: {},
    parentNode: null,
    eventListeners: null
  }

  return node
}

function createText(text: string): TestText {
  const node: TestText = {
    id: nodeId++,
    type: NodeTypes.TEXT,
    text,
    parentNode: null
  }

  return node
}

function createComment(text: string): TestComment {
  const node: TestComment = {
    id: nodeId++,
    type: NodeTypes.COMMENT,
    text,
    parentNode: null
  }

  return node
}

function remove(child: TestNode) {
  const parent = child.parentNode
  if (parent) {
    // 找到自己在父节点中的位置
    const i = parent.children.indexOf(child)
    if (i > -1) {
      // 如果存在则将自己从父节点中删除
      parent.children.splice(i, 1)
    } else {
      // 抛出报错信息
      console.error('target: ', child)
      console.error('parent: ', parent)
      throw Error('target is not a childNode of parent')
    }
    // 释放自己对父节点的引用
    child.parentNode = null
  }
}

/**
 * @description 插入元素 -- 可以传入锚点指定插入的位置 会插入到锚点之前
 * @param child 子节点
 * @param parent 父元素
 * @param ref 锚点 -- 如果传入则会将子节点插入到该锚点之前
 */
function insert(child: TestNode, parent: TestElement, ref?: TestNode | null) {
  let refIndex
  if (ref) {
    // 如果传入了锚点 就要先计算出锚点在父元素的 children 中的位置
    refIndex = parent.children.indexOf(ref)
    if (refIndex === -1) {
      // 锚点不存在需要报错提醒
      console.error('ref: ', ref)
      console.error('parent: ', parent)
      throw new Error('ref is not a child of parent')
    }
  }
  // 如果 child 已经再 parent 中则需要先删除它
  // 是否存在的逻辑 remove 中会处理
  remove(child)
  // 删除 child 之后锚点的位置可能会变化 需要重新计算
  refIndex = ref ? parent.children.indexOf(ref) : -1
  if (refIndex === -1) {
    // 没有锚点 -- 直接插入到最后
    parent.children.push(child)
    child.parentNode = parent
  } else {
    // 有传入锚点并且找到了锚点的位置 -- 把子节点插入到锚点前
    parent.children.splice(refIndex, 0, child)
    child.parentNode = parent
  }
}

// 在 NodeJS 中模拟的 DOM 环境操作
export const nodeOps = {
  createElement,
  createText,
  createComment,
  remove,
  insert
}
