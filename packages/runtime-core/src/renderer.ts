import { VNode } from './vnode'

export interface Renderer<HostElement = RendererElement> {
  render: RootRenderFunction<HostElement>
}

export interface RendererNode {
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
  // 用于更新元素的属性
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void
  // 移除元素
  remove(el: HostNode): void
}

// patch 打补丁函数的类型
type PatchFn = (
  n1: VNode | null, // null 意味着要挂载 vnode
  n2: VNode,
  container: RendererElement
) => void

type UnmountFn = (vnode: VNode) => void

export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions): Renderer<HostElement> {
  // 将自定义渲染器接口抽象成 options 供外界调用者进行个性化配置
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    insert: hostInsert,
    patchProp: hostPatchProp,
    remove: hostRemove
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
    // 创建元素的同时还要将其赋值到 vnode.el 上，这样就能够在别的地方通过 vnode 直接获取对真实 DOM 元素的引用
    const el = (vnode.el = hostCreateElement(vnode.type as string))
    const { props } = vnode

    // 处理子节点
    if (typeof vnode.children === 'string') {
      // 如果子节点是字符串则意味着元素具有文本结点
      // el.textContent = vnode.children
      hostSetElementText(el, vnode.children as string)
    }

    // 处理 props
    if (props) {
      // 遍历 key 调用 hostPatchProp 去处理属性的更新
      for (const key in props) {
        // 由于是 mountElement，元素是首次被挂载 所以不存在旧 prop
        hostPatchProp(el, key, null, props[key])
      }
    }

    // 将元素添加到容器中
    // container.appendChild(el)
    hostInsert(el, container)
  }

  const unmount: UnmountFn = vnode => {
    // 调用自定义渲染器中的实现将 vnode 卸载
    hostRemove(vnode)
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
        // 通过这种直接将 `innerHTML = ''` 的方式卸载 vnode 是不对的，存在以下几个问题
        // 1. 容器的内容可能是由某个或多个组件渲染的，当卸载操作发生时
        //    应该正确地调用这些组件的 beforeUnmount、unmounted 等生命周期函数
        // 2. 即使内容不是由组件渲染的，有的元素存在自定义指令，我们应该在卸载
        //    操作发生时正确执行对应的指令钩子函数
        // 3. 不能移除绑定在 DOM 元素上的事件处理函数
        // 并且由于要考虑到渲染的通用性，所以要将卸载的操作转移到自定义渲染器中
        // 调用自定义渲染器实现的移除元素的实现去卸载元素
        // container.innerHTML = '' // <-- 这种方式卸载元素有缺陷
        unmount(container._vnode)
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
