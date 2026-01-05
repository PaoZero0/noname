
# 📚 无名杀工程分析 - 文档导航与学习路线

> 针对有 Vue 前端基础和 Node.js 后端基础的开发者

---

## 🎯 你应该阅读的文档

本项目为你准备了 4 份核心文档，根据你的需求选择阅读：

### 📖 1. [ENGINEERING_ANALYSIS.md](./ENGINEERING_ANALYSIS.md) - 完整工程分析
**你需要了解什么？全面的工程结构和技术细节**

内容：
- ✅ 项目整体架构（5 层架构图）
- ✅ 完整技术栈说明
- ✅ 所有核心目录的详细解析
- ✅ 游戏执行流程
- ✅ 扩展系统原理
- ✅ 数据结构定义
- ✅ 多平台适配

**适合：** 想要全面了解项目的开发者（2-3 小时阅读）

---

### 🚀 2. [QUICK_START_CN.md](./QUICK_START_CN.md) - 快速上手指南
**我想快速开始开发，该从何入手？**

内容：
- ✅ 30 分钟快速启动
- ✅ 核心概念理解（对标你的技术栈）
- ✅ 常见开发任务快速指南
- ✅ 常见错误与解决
- ✅ 学习路径建议
- ✅ 关键文件阅读顺序

**适合：** 急于上手开发的你（1-2 小时快速入门）

**立即开始：** `pnpm install && pnpm dev`

---

### 🏛️ 3. [TECH_STACK_COMPARISON.md](./TECH_STACK_COMPARISON.md) - 技术栈对比与架构图
**我想理解这个项目与我熟悉的技术有什么区别**

内容：
- ✅ Vue vs 无名杀 UI 系统
- ✅ Vuex vs 全局状态管理
- ✅ Express 后端分析
- ✅ 详细架构图（3 层 + 数据流向）
- ✅ 关键数据结构深度解析
- ✅ 技能系统完整生命周期
- ✅ 概念速记表

**适合：** 熟悉现代前端框架但需要理解这个项目特殊性的你（1-2 小时理解）

---

### 💻 4. [PRACTICAL_TASKS.md](./PRACTICAL_TASKS.md) - 常见任务实战指南
**我想通过做实际任务来学习项目**

内容：
- ✅ 12 个分级任务（从简单到困难）
- ✅ Task 1-3：简单配置修改（30 分钟）
- ✅ Task 4-7：中等任务（1-2 小时）
- ✅ Task 8-10：困难任务（2-4 小时）
- ✅ Task 11-12：高难度引擎改动（4+ 小时）
- ✅ 开发流程检查清单
- ✅ 调试技巧与性能优化

**适合：** 喜欢边做边学的实践派（按任务循序渐进）

---

## 🗺️ 学习路线建议

### 🟢 方案 A：快速上手（2-3 天）
*适合：急于开始贡献代码的开发者*

```
Day 1:
  1. 读 QUICK_START_CN.md (30 分钟)
  2. 运行 pnpm dev 启动项目 (15 分钟)
  3. 在浏览器中玩一盘游戏，打开 DevTools 观察 (30 分钟)
  4. 做 PRACTICAL_TASKS 中的 Task 1-3 (1 小时)

Day 2:
  5. 读 TECH_STACK_COMPARISON.md 了解架构 (1 小时)
  6. 做 Task 4-5：添加武将/修改属性 (1-2 小时)

Day 3:
  7. 做 Task 6-7：调整技能、创建扩展 (2-3 小时)
  8. 开始你自己的项目
```

---

### 🟡 方案 B：深度理解（1-2 周）
*适合：想要全面掌握项目的开发者*

```
Week 1:
  Day 1-2: 读 ENGINEERING_ANALYSIS.md (2-3 小时)
  Day 2-3: 读 TECH_STACK_COMPARISON.md (1-2 小时)
  Day 3-4: 做 PRACTICAL_TASKS 中的 Task 1-7 (5-6 小时)
  Day 5:   复习和总结

Week 2:
  Day 1-2: 阅读核心源代码
    - noname/entry.js（启动入口）
    - noname/game/index.js 前 1000 行（游戏引擎）
    - noname/library/index.js 前 1000 行（游戏库）
  
  Day 3-4: 做 Task 8-10（复杂技能和扩展）
  Day 5:   自己设计一个新武将或扩展功能
```

---

### 🔴 方案 C：成为贡献者（4 周+）
*适合：想要长期贡献代码的开发者*

```
Week 1: 快速上手（同方案 A）

Week 2: 深入理解
  - 完整阅读所有文档
  - 追踪关键代码执行流
  - 理解每个核心模块的职责

Week 3: 实战练习
  - 完成所有 12 个任务
  - 修复一个真实 Bug
  - 实现一个小功能

Week 4+: 贡献代码
  - 实现更复杂的功能
  - 优化现有代码
  - 提交 Pull Request
```

---

## 📚 按学习目标查找资源

### 我想学习...

#### 🎮 游戏流程和规则引擎
**文档：** ENGINEERING_ANALYSIS.md + TECH_STACK_COMPARISON.md
**任务：** PRACTICAL_TASKS Task 6-9
**源代码：** 
- [noname/game/index.js](./noname/game/index.js) - 游戏主逻辑
- [noname/game/check.js](./noname/game/check.js) - 规则检查

---

#### 🧠 AI 和决策系统
**文档：** ENGINEERING_ANALYSIS.md 中的 AI 部分
**源代码：**
- [noname/ai/index.js](./noname/ai/index.js) - AI 主类
- [noname/ai/basic.js](./noname/ai/basic.js) - AI 实现

---

#### 🎨 UI 系统和交互
**文档：** TECH_STACK_COMPARISON.md 中的"UI 系统"部分
**任务：** PRACTICAL_TASKS Task 3
**源代码：**
- [noname/ui/](./noname/ui/) - UI 系统
- [layout/](./layout/) - 布局定义
- [theme/](./theme/) - 样式系统

---

#### 🔌 扩展系统和插件开发
**文档：** 
- ENGINEERING_ANALYSIS.md 中的"扩展系统"
- QUICK_START_CN.md 中的"创建扩展"

**任务：** PRACTICAL_TASKS Task 7-10

**源代码：**
- [extension/](./extension/) - 扩展示例
- [noname/library/hooks/](./noname/library/hooks/) - 钩子系统

---

#### 🛠️ 技能系统实现
**文档：**
- TECH_STACK_COMPARISON.md 中的"技能系统完整生命周期"
- QUICK_START_CN.md 中的"核心概念"

**任务：** PRACTICAL_TASKS Task 4-9

**源代码：**
- [typings/Skill.d.ts](./typings/Skill.d.ts) - 技能类型定义
- [character/](./character/) - 武将及其技能定义
- [noname/library/skill.js](./noname/library/skill.js) - 技能库

---

#### 💾 数据结构和状态管理
**文档：** TECH_STACK_COMPARISON.md 中的"全局五大对象"

**源代码：**
- [typings/](./typings/) - 类型定义
- [noname/library/element/](./noname/library/element/) - 元素类定义

---

#### 🌐 多平台适配（Web/Cordova/Electron）
**文档：** ENGINEERING_ANALYSIS.md 中的"多平台适配"

**源代码：**
- [noname/init/](./noname/init/) - 各平台初始化
- [noname/entry.js](./noname/entry.js) - 平台检测

---

#### 🚀 构建和部署
**文档：** ENGINEERING_ANALYSIS.md 中的"开发工作流"

**源代码：**
- [vite.config.ts](./vite.config.ts) - Vite 配置
- [scripts/build.ts](./scripts/build.ts) - 构建脚本
- [Dockerfile](./Dockerfile) - Docker 配置
- [docker-compose.yml](./docker-compose.yml) - Docker Compose

---

## 🔧 快速命令参考

```bash
# 安装依赖
pnpm install

# 开发模式（带热更新）
pnpm dev

# 构建生产版本
pnpm build

# 构建完整包（含所有资源）
pnpm build:full

# 构建差异包
pnpm build:diff

# 生产环境运行
pnpm start

# 代码检查
pnpm lint

# Docker 本地测试
docker compose up -d --build

# 生成类型定义
pnpm build:types
```

---

## 📊 文档内容速览

| 文档 | 长度 | 阅读时间 | 最佳阅读时机 |
|------|------|--------|-----------|
| QUICK_START_CN.md | 250 行 | 30-45 分钟 | 立即开始（第一阶段） |
| TECH_STACK_COMPARISON.md | 400 行 | 1-1.5 小时 | 了解架构（第二阶段） |
| ENGINEERING_ANALYSIS.md | 600 行 | 2-3 小时 | 深入学习（第二阶段） |
| PRACTICAL_TASKS.md | 450 行 | 边读边做 | 全程参考（第三阶段） |

---

## 🎓 核心概念速记

### 五大全局对象
- **game**: 游戏实例，控制游戏流程
- **lib**: 游戏库，提供所有数据和工具
- **ui**: UI 系统，管理界面
- **get**: 查询接口，获取游戏数据
- **ai**: AI 系统，计算机决策

### 三个关键事件处理概念
- **trigger**: 何时发动（监听哪个事件）
- **filter**: 是否满足条件（过滤检查）
- **content**: 执行什么效果（异步执行）

### 三层架构
```
Layer 1: 平台适配 (Web/Cordova/Electron)
Layer 2: 基础服务 (配置、音频、路径解析)
Layer 3: 游戏逻辑 (game、library、ui)
Layer 4: 游戏内容 (武将、卡牌、模式)
Layer 5: 用户界面 (UI、样式、布局)
```

---

## 🚨 常见困惑解答

### Q: "为什么有些是 .js 而有些是 .ts？"
A: 项目混用 JavaScript 和 TypeScript。.ts 文件提供类型安全，.js 文件保持灵活性。两者都会被编译。

### Q: "Vue 在这个项目中的作用是什么？"
A: Vue 主要用于一些 UI 组件。核心游戏逻辑使用原生 DOM API 和事件系统，不是 Vue 驱动。

### Q: "为什么要同时运行 8080 和 8089 两个端口？"
A: 8080 是 Vite 前端开发服务器（支持 HMR），8089 是 Express 后端服务器（提供 API）。

### Q: "我应该先看源代码还是先看文档？"
A: **先看文档建立概念**，然后跟踪源代码理解细节。不要一开始就埋头读代码。

### Q: "如何快速找到我需要修改的代码？"
A: 使用 VS Code 的搜索功能 (Ctrl+Shift+F) 搜索关键词，然后用 "Go to Definition" (F12) 追踪。

---

## 🤝 如何贡献代码

### 提交 Bug 修复
1. Fork 项目
2. 在本地修复 Bug
3. 提交到 **PR-Branch** 分支（这很重要！）
4. 创建 Pull Request

### 提交新功能
1. 在 GitHub Issues 中讨论你的想法
2. 获得核心团队反馈
3. 实现功能
4. 编写测试
5. 提交 PR

### 贡献扩展
1. 在 `extension/` 中创建新文件夹
2. 编写扩展代码
3. 提交 PR

---

## 📞 获取帮助

### 资源
- 📖 [官方 Wiki](https://github.com/libnoname/noname/wiki)
- 💬 [GitHub Issues](https://github.com/libnoname/noname/issues)
- 🐛 [报告 Bug](https://github.com/libnoname/noname/issues/new)

### 提问建议
1. 先搜索是否有相同问题
2. 提供清晰的问题描述和复现步骤
3. 附上错误截图或日志
4. 说明你的环境（OS、Node 版本等）

---

## ✅ 快速检查清单

在开始开发前，确保：

- [ ] Node.js 版本 >= 22.12.0
- [ ] pnpm 版本 >= 9
- [ ] 已运行 `pnpm install`
- [ ] 已运行 `pnpm dev` 并成功启动
- [ ] 浏览器能访问 http://localhost:8080
- [ ] 打开 DevTools (F12) 查看是否有错误

---

## 🎯 下一步行动

### 如果你现在有 1 小时
👉 阅读 [QUICK_START_CN.md](./QUICK_START_CN.md) 然后运行 `pnpm dev`

### 如果你现在有 3 小时
👉 完成 [QUICK_START_CN.md](./QUICK_START_CN.md) 和 [PRACTICAL_TASKS.md](./PRACTICAL_TASKS.md) 的 Task 1-3

### 如果你现在有 1 天
👉 按照"方案 A"完整走一遍

### 如果你有时间深入
👉 按照"方案 B 或 C"系统学习

---

## 📝 文档更新

- **创建时间**：2026 年 1 月 5 日
- **对应版本**：无名杀 v1.11.0
- **作者**：GitHub Copilot
- **最后更新**：2026 年 1 月 5 日

如有问题或建议，欢迎反馈！

---

**祝你在无名杀项目中的开发之旅愉快！** 🚀

