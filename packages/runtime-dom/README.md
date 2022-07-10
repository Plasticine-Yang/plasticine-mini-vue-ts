# @plasticine-mini-vue-ts/runtime-dom

## Feature

### 实现 DOM 平台下的自定义渲染器接口

- [x] 用于在`DOM`环境下进行渲染，通过实现`runtime-core`模块提供的自定义渲染器接口来完成在浏览器`DOM`环境下享受到`vue`的运行时特性和响应式系统
- [x] 由于`patchProp`的实现比较复杂，所以将`patchProp`渲染器接口的实现从`nodeOps`中抽离，类型声明上使用`Omit`工具类型将`patchProp`排除，从而将`patchProp`的实现分离到单独的文件中去实现
