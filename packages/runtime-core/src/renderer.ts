import { VNode } from './vnode'

interface RendererNode {
  [key: string]: any
}

interface RendererElement extends RendererNode {}

// 渲染函数的类型
type RootRenderFunction<HostElement = RendererElement> = (
  vnode: VNode | null,
  container: HostElement
) => void

// patch 打补丁函数的类型
type PatchFn = (
  n1: VNode | null, // null 意味着要挂载 vnode
  n2: VNode,
  container: RendererElement
) => void

export function createRenderer() {
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
    // 创建 DOM 元素
    const el = document.createElement(vnode.type as string)
    // 处理子节点
    if (typeof vnode.children === 'string') {
      // 如果子节点是字符串则意味着元素具有文本结点
      el.textContent = vnode.children
    }
    // 将元素添加到容器中
    container.appendChild(el)
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
