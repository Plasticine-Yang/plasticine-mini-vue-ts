# @plasticine-mini-vue-ts/reactivity

## Features

### effect

- [x] `effect`核心逻辑，基于`proxy`实现依赖收集和触发依赖，可在`__test__/effect.spec.ts`中查看对应功能的单元测试，所有单元测试对应的功能均已实现
- [x] 语义化触发依赖，抽象出对响应式对象的依赖触发的三种触发语义，`ADD`、`SET`和`DELETE`
- [x] 支持对`for in`循环遍历对象时的依赖触发，在`ADD`和`DELETE`语义触发时执行依赖副作用函数
- [x] 支持数组对象的响应式，核心在于处理索引超出数组长度设置值时导致的隐式数组长度变化的依赖副作用函数执行
- [x] 支持对`symbol`属性的响应式，并且排除掉内建的`JavaScript`严格模式下不可访问的`Symbol`属性的响应式监听
- [x] 使用`Reflect.get`传递`receiver`，解决代理对象访问器属性中的`this`指向问题，不使用`Reflect`传递`receiver`，而是直接使用`target[key]`的方式的话会导致访问器属性中`this`指向原始对象，绕过代理对象的`get`拦截，从而无法正常收集依赖
- [x] 响应式对象修改时，如果修改前后值没有发生变化不会触发相关依赖，避免不必要的性能开销
