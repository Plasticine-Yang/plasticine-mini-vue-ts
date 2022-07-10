import { VNode } from './vnode'

export interface Renderer<HostElement = RendererElement> {
  render: RootRenderFunction<HostElement>
}

interface RendererNode {
  [key: string]: any
}

interface RendererElement extends RendererNode {}

// 渲染函数的类型
export type RootRenderFunction<HostElement = RendererElement> = (
  vnode: VNode | null,
  container: HostElement
) => void

/**
 * @description 自定义渲染器的接口 -- 用于抽象 DOM 操作为与平台无关的操作
 *
 * 抽离后再在 runtime-dom 中实现 DOM 平台下的渲染接口即可
 * 这样一来想在别的平台渲染的时候 只需要实现这个自定义渲染器的接口即可
 */
export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement
> {
  // 创建 Element -- 比如 document.createElement('div')
  createElement(type: string): HostElement
  // 设置 Element 的文本内容 -- 比如 el.textContent = 'hello' --> <div>hello</div>
  setElementText(node: HostElement, text: string): void
  // 插入结点到容器元素中 -- 比如 container.appendChild(el)
  // 只有 Element 中才能容纳别的结点 比如 <div><p>hello</p></div>
  // 而 Text 和 Comment 类型的结点是不能存放子节点的，所以 parent 需要是 Element 类型
  insert(el: HostNode, parent: HostElement): void
}

// patch 打补丁函数的类型
type PatchFn = (
  n1: VNode | null, // null 意味着要挂载 vnode
  n2: VNode,
  container: RendererElement
) => void

export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>) {
  // 将自定义渲染器接口抽象成 options 供外界调用者进行个性化配置
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    insert: hostInsert
  } = options

  /**
   * @description 打补丁 -- 处理挂载、卸载、更新 vnode 的主入口
   * @param n1 旧 vnode
   * @param n2 新 vnode
   * @param container 容器元素
   */
  const patch: PatchFn = (n1, n2, container) => {
    // 新旧 vnode 相同没必要打补丁
    if (n1 === n2) return

    if (n1 === null) {
      // 旧 vnode 不存在 -- 说明要挂载新 vnode 也就是 n2
      mountElement(n2, container)
    } else {
      // n1 存在则进行打补丁
    }
  }

  const mountElement = (vnode: VNode, container: RendererElement) => {
    // 创建 DOM 元素 -- 可以抽象成与 DOM 无关的接口从而实现跨平台
    // const el = document.createElement(vnode.type as string)
    const el = hostCreateElement(vnode.type as string)
    // 处理子节点
    if (typeof vnode.children === 'string') {
      // 如果子节点是字符串则意味着元素具有文本结点
      // el.textContent = vnode.children
      hostSetElementText(el, vnode.children as string)
    }
    // 将元素添加到容器中
    // container.appendChild(el)
    hostInsert(el, container)
  }

  /**
   * @description 核心渲染函数
   * @param vnode 虚拟结点
   * @param container 容器元素
   */
  const render: RootRenderFunction = (vnode, container) => {
    if (vnode === null) {
      // 没有新的 vnode -- 说明是要进行卸载操作
      if (container._vnode) {
        container.innerHTML = ''
      }
    } else {
      // 如果有 vnode 则对其进行打补丁
      // 初次渲染的时候 container 上没有 _vnode 属性，所以打补丁会挂载 vnode
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }

  return {
    render
  }
}
