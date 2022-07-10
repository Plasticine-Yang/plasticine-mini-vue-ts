# plasticine-mini-vue-ts

一个短小精悍的`vue`，实现了`vue`的一些核心功能，忽略许多影响阅读`vue`源码的边缘`case`，是一个学习`vue`源码的好帮手

## Features

### 基于 monorepo 架构

使用`turborepo`将各个模块分割成单独的仓库，方便管理和维护

### reactivity

实现了一个能够使用的响应式系统（并没有全部实现，只把大部分常见功能实现了），详见[reactivity](packages/reactivity)

### runtime-core

实现`vue`的核心运行时逻辑，主要核心在于渲染器的实现，抽象`DOM`环境下的渲染逻辑为通用渲染逻辑，以一个`options`参数对象的方式传给`createRenderer`从而实现自定义渲染器的功能，详见[runtime-core](packages/runtime-core)

### runtime-dom

基于`DOM`环境实现自定义渲染器的接口，详见[runtime-dom](packages/runtime-dom)
