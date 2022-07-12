# @plasticine-mini-vue-ts/runtime-test

这个仓库中用于测试`runtime-core`，实现了一个模拟浏览器`DOM`环境，能够在`node`环境下实现基本的浏览器中的`DOM`效果，方便通过单元测试去检验渲染器的效果

模拟`DOM`的源码实现在`src/nodeOps.ts`中，并且`__test__`中有基本的单元测试

## 事件监听

- [x] 实现基本的事件监听和触发事件逻辑，能够满足测试场景的需要
