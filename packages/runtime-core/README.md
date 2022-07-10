# @plasticine-mini-vue-ts/runtime-core

## Feature

### 渲染器

- [x] 抽象出自定义渲染器接口，作为`createRenderer`函数的参数传入，将原本的限定于`DOM`平台的渲染逻辑抽离成平台通用的接口，只要实现了这套自定义渲染器接口就能实现跨平台享受`vue`的运行时特性和响应式系统
