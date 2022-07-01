# @plasticine-mini-vue-ts/reactivity

## Features

- [x] `effect`核心逻辑，基于`proxy`实现依赖收集和触发依赖，可在`__test__/effect.spec.ts`中查看对应功能的单元测试，所有单元测试对应的功能均已实现
- [x] 语义化触发依赖，抽象出对响应式对象的依赖触发的三种触发语义，`ADD`、`SET`和`DELETE`
- [x] 支持对`for in`循环遍历对象时的依赖触发，在`ADD`和`DELETE`语义触发时执行依赖副作用函数
- [x] 支持数组对象的响应式，核心在于处理索引超出数组长度设置值时导致的隐式数组长度变化的依赖副作用函数执行
- [x] 支持对`symbol`属性的响应式，并且排除掉内建的`JavaScript`严格模式下不可访问的`Symbol`属性的响应式监听
