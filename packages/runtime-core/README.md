# @plasticine-mini-vue-ts/runtime-core

## Feature

### 渲染器

- [x] 抽象出自定义渲染器接口，作为`createRenderer`函数的参数传入，将原本的限定于`DOM`平台的渲染逻辑抽离成平台通用的接口，只要实现了这套自定义渲染器接口就能实现跨平台享受`vue`的运行时特性和响应式系统

#### 卸载元素

- 抽离卸载元素的逻辑到自定义渲染器接口中

  通过这种直接将 `innerHTML = ''` 的方式卸载 vnode 是不对的，存在以下几个问题：

  1. 容器的内容可能是由某个或多个组件渲染的，当卸载操作发生时
     应该正确地调用这些组件的 beforeUnmount、unmounted 等生命周期函数
  2. 即使内容不是由组件渲染的，有的元素存在自定义指令，我们应该在卸载
     操作发生时正确执行对应的指令钩子函数
  3. 不能移除绑定在 DOM 元素上的事件处理函数
     并且由于要考虑到渲染的通用性，所以要将卸载的操作转移到自定义渲染器中
     调用自定义渲染器实现的移除元素的实现去卸载元素

     ```ts
     container.innerHTML = '' // <-- 这种方式卸载元素有缺陷
     ```

  所以关键就在于要能够通过`vnode`获取到对应的真实`DOM`元素，然后封装卸载逻辑，调用对应的自定义渲染器接口实现去完成卸载操作

  因此要给`vnode`添加一个`el`属性，指向真实`DOM`元素

  ```ts
  export interface VNode<HostNode = RendererNode> {
    el: HostNode | null
  }
  ```

  然后在`mountElement`的时候将创建的元素赋值到`vnode.el`上

  ```ts
  const mountElement = (vnode: VNode, container: RendererElement) => {
    // 创建元素的同时还要将其赋值到 vnode.el 上，这样就能够在别的地方通过 vnode 直接获取对真实 DOM 元素的引用
    const el = (vnode.el = hostCreateElement(vnode.type as string))
    // ...
  }
  ```

---
