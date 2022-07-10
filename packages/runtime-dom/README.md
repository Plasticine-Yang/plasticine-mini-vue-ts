# @plasticine-mini-vue-ts/runtime-dom

## Feature

### 实现 DOM 平台下的自定义渲染器接口

- [x] 用于在`DOM`环境下进行渲染，通过实现`runtime-core`模块提供的自定义渲染器接口来完成在浏览器`DOM`环境下享受到`vue`的运行时特性和响应式系统

#### patchProp

- [x] 由于`patchProp`的实现比较复杂，所以将`patchProp`渲染器接口的实现从`nodeOps`中抽离，类型声明上使用`Omit`工具类型将`patchProp`排除，从而将`patchProp`的实现分离到单独的文件中去实现
- [x] 对`DOM Properties`和`HTML Attributes`做了区分，当设置的属性存在于元素上时，使用`DOM Properties`的方式进行设置，不存在时则使用`el.setAttribute(key, value)`的方式进行设置
- [x] 对于布尔类型的`prop`能够正确处理，比如下面这种情形

  ```html
  <button disabled></button>
  ```

  解析成`vnode`则是：

  ```
  {
    type: 'button',
    props: {
      disabled: ''
    }
  }
  ```

  而如果直接通过`DOM Properties`的方式设置的话，空字符串转成布尔值会是`false`，但正确来说应当转成`true`才是符合用户本来的意图的，所以进行了特殊处理
