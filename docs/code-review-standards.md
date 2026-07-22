# 净排 · 代码审查标准与流程

> 文档版本：v1.0 · 2026-07-17
> 适用项目：净排（JingPai）—— 纯本地公众号 Markdown 排版工具
> 审查者角色：火眼眼 👁️ — 代码审查专家

---

## 目录

1. [审查流程](#1-审查流程)
2. [审查等级与标签](#2-审查等级与标签)
3. [通用审查清单](#3-通用审查清单)
4. [Vue 3 专项审查](#4-vue-3-专项审查)
5. [安全专项审查](#5-安全专项审查)
6. [Milkdown / ProseMirror 专项审查](#6-milkdown--prosemirror-专项审查)
7. [隐私与纯前端约束审查](#7-隐私与纯前端约束审查)
8. [性能专项审查](#8-性能专项审查)
9. [CSS / 样式专项审查](#9-css--样式专项审查)
10. [工具标准化建议](#10-工具标准化建议)
11. [PR 模板](#11-pr-模板)
12. [审查回复格式](#12-审查回复格式)
13. [验收标准](#13-验收标准)

---

## 1. 审查流程

```
开发者提交 PR
    │
    ▼
┌─────────────────────────────────────┐
│  Step 1: 自动检查（CI Gate）        │
│  ├─ eslint 零 error                 │
│  ├─ vite build 通过                 │
│  └─ 无新安全警告                     │
└──────────┬──────────────────────────┘
           │ pass
           ▼
┌─────────────────────────────────────┐
│  Step 2: 代码审查（人工）            │
│  ├─ 对照本规范逐项检查               │
│  ├─ 标注 🔴 🟡 💭                   │
│  └─ 给出总体评价                     │
└──────────┬──────────────────────────┘
           │ approved
           ▼
┌─────────────────────────────────────┐
│  Step 3: 合并前检查                  │
│  ├─ CHANGELOG.md 已更新             │
│  ├─ 🔴 全部 resolved                │
│  └─ 🟡 至少讨论过                   │
└──────────┬──────────────────────────┘
           │ merge
           ▼
┌─────────────────────────────────────┐
│  Step 4: 合并后                     │
│  └─ 如有必要，补充测试或文档         │
└─────────────────────────────────────┘
```

### 1.1 审查时机

| 触发条件 | 审查要求 |
|---------|---------|
| 新功能（feature 分支 → main） | 完整审查（Step 1–4） |
| Bug 修复（fix 分支 → main） | 完整审查，重点关注修复逻辑完整性和回归 |
| 重构（refactor 分支 → main） | 完整审查，重点关注行为不变性 |
| 文档/配置改动 | 轻量审查（仅 Step 2 文档相关项） |
| 紧急热修复 | 事后 24h 内补审 |

### 1.2 角色定义

| 角色 | 职责 |
|-----|------|
| **作者（Author）** | 提交 PR 前自测通过、CI 绿、填写 PR 描述 |
| **审查者（Reviewer）** | 逐项对照本规范检查，给出评级标注 |
| **合并者（Merger）** | 确认所有 🔴 resolved、至少一个 approval 后 squash-merge |

---

## 2. 审查等级与标签

### 优先级标签

| 标签 | 含义 | 行动要求 |
|------|-----|---------|
| 🔴 **Blocker** | 必须修复：Bug、安全漏洞、数据丢失风险 | 合并前必须 resolved |
| 🟡 **Suggestion** | 建议修复：可维护性、性能、可读性 | 最少讨论过，作者知晓 |
| 💭 **Nit** | 小优化：命名、格式、文档 | 可选，留作后续改进 |

### 评价维度

```typescript
interface ReviewVerdict {
  correctness:  1 | 2 | 3 | 4 | 5;  // 功能正确性
  security:     1 | 2 | 3 | 4 | 5;  // 安全可靠性
  maintainable: 1 | 2 | 3 | 4 | 5;  // 可维护性
  performance:  1 | 2 | 3 | 4 | 5;  // 性能
  testing:      1 | 2 | 3 | 4 | 5;  // 测试覆盖
}
```

---

## 3. 通用审查清单

### 3.1 功能正确性

- [ ] 改动是否实现了 PR 描述中声明的功能？
- [ ] 边界情况是否处理了？（空输入、极长输入、特殊字符、并行操作）
- [ ] 错误路径是否恰当处理？（fetch 失败、JSON 解析失败、DOM 不存在）
- [ ] 竞态条件是否存在？（异步操作完成前组件已卸载）
- [ ] 状态一致性是否保持？（多个 ref 同时更新时不会出现中间状态）

### 3.2 可维护性

- [ ] 变量/函数命名是否自描述？（是 `handleClick` 而非 `handler`，是 `userList` 而非 `data`）
- [ ] 复杂逻辑是否有注释说明**为什么**而非**是什么**？
- [ ] 魔法数字/字符串是否提取为常量？
- [ ] 是否有大段重复代码可以抽取为函数？
- [ ] 单文件/单函数是否过大？（App.vue 应关注，建议超 4000 行考虑拆分）

### 3.3 错误处理

- [ ] `try/catch` 是否捕获了所有可预见的异常？
- [ ] 后端无关的项目中，`catch` 是否有合理的 fallback 行为？（不应让 UI 完全卡死）
- [ ] 异步操作是否正确处理了 loading/error/success 三态？

### 3.4 版本兼容

- [ ] 是否有破坏性变更？（需要修改 `CHANGELOG.md` 并注明 Breaking Change）
- [ ] localStorage key 是否保持向后兼容？（新增字段需要处理旧数据不存在的情况）
- [ ] 依赖升级是否经过验证？

---

## 4. Vue 3 专项审查

### 4.1 Composition API

- [ ] `ref` vs `reactive` 使用是否得当？（基本类型用 `ref`，对象用 `reactive`，但在 `<script setup>` 中推荐统一用 `ref`）
- [ ] `computed` 是否有副作用？（computed 应是纯函数）
- [ ] `watch` 是否指定了 `deep` / `immediate` / `flush`？（默认是 shallow watch）
- [ ] `watch` 监听器是否有防循环机制？（如净排中的 `isFromEditor` / `isSettingEditor` 双闸门）

### 4.2 模板

- [ ] `v-if` / `v-show` 选择是否合理？（`v-if` 惰性，`v-show` 频繁切换）
- [ ] `v-for` 是否带 `:key`？（且 key 不推荐用 index）
- [ ] 事件绑定是否及时清理？（`onMounted` 注册 `addEventListener` → `onUnmounted` `removeEventListener`）
- [ ] 模板逻辑是否过于复杂？（应尽量提取到 computed 或函数中）

### 4.3 组件设计

- [ ] 当前单文件架构（3273 行），新增代码是否应考虑拆分组件？
- [ ] 拆分的组件边界是否合理？（单一职责、可复用性）
- [ ] Props 是否有类型默认值和验证？

### 审查重点举例（来自净排代码库）

```vue
<!-- ✅ 正确：watch 防循环闸门 -->
watch(markdownText, (newMd) => {
  if (!isFromEditor && !isSettingEditor && milkdownEditor) {
    isSettingEditor = true;
    milkdownEditor.action(replaceAll(newMd));
    isSettingEditor = false;
  }
});

<!-- 💭 建议：模板硬编码快捷键列表可提取为数据驱动 -->
const SHORTCUTS = [
  { keys: ['⌃', '⇧', 'C'], desc: '复制 HTML 到剪贴板' },
  { keys: ['⌃', '⇧', 'P'], desc: '切换预览' },
  // ...
];
```

---

## 5. 安全专项审查

### 5.1 XSS 防护（净排核心关切）

- [ ] **所有用户输入必须经过 DOMPurify 过滤**才进入 `innerHTML` / `v-html` 渲染
- [ ] `buildHtml()` 输出的 HTML 是否经过了 `DOMPurify.sanitize()`？
- [ ] `marked.parse()` 的输出是 HTML，是否在插入 DOM 前 sanitize？
- [ ] URL 注入：图片 URL 是否进行了协议白名单校验（只允许 `https://`）？

### 5.2 存储安全

- [ ] localStorage 存储的是用户自己的 API key —— 是否明确告知用户这是纯本地存储？
- [ ] 无需额外的加密（localStorage 本身是同源隔离的），但需在 UI 中明示「key 只存本机」

### 5.3 网络请求（AI 功能）

- [ ] 用户 API key 是否仅用于 HTTP header `Authorization`，未暴露在 URL / body 日志中？
- [ ] `fetch()` 是否配置了 `signal`（AbortController）以防止悬空请求？
- [ ] 请求失败时，错误信息是否不会泄漏 key 或 token 片段？
- [ ] CORS 错误提示是否引导用户使用 OpenRouter 等 CORS-friendly 服务？

### 🔴 Blocker 示例

```javascript
// 🔴 XSS：用户输入的 markdown 经 marked 渲染后直接插入 DOM
// 但 net排 的做法是正确的，因为它用 DOMPurify 做了二次净化：
const cleanHtml = DOMPurify.sanitize(marked.parse(md));
// ✅ 正确做法
```

---

## 6. Milkdown / ProseMirror 专项审查

净排的核心编辑器基于 Milkdown v7（ProseMirror 上层封装），这块出问题会直接导致编辑功能不可用。

### 6.1 编辑器初始化

- [ ] `Editor.make()` 后的 `.use()` 注册顺序是否合理？（预设先于自定义插件）
- [ ] 是否捕获了编辑器初始化的异常？
- [ ] 自定义 `$nodeSchema` / `$remark` 是否兼容 Milkdown 的插件生命周期？

### 6.2 内容同步

- [ ] 编辑器 ↔ markdownText 的双向同步是否防循环？（检查 `isFromEditor` / `isSettingEditor` 双闸门）
- [ ] 程序化改写（AI / 导入 / 装饰插入）后 `markdownText.value` 是否显式同步？
- [ ] `replaceAll()` 调用是否会引起光标重置？是否有必要保留用户光标位置？

### 6.3 remark-directive（自定义容器语法）

```javascript
// 🔴 已知坑：remark-directive 必须用 $remark 包装
// 错误：editor.use(remarkDirectivePlugin);  // self.data() 返回 undefined
// 正确：
const remarkDirective = $remark('remarkDirective', () => remarkDirectivePlugin);
editor.use(remarkDirective);
```

- [ ] 自定义语法 `::: cover / divider / quote` 的解析和序列化是否完整？
- [ ] remark-stringify 是否给 `:::` 加了转义 `\:::` ？（需要在 buildHtml 中清理）

---

## 7. 隐私与纯前端约束审查

这是净排的**核心差异化和信任基石**，任何破坏"纯本地"的改动都是 🔴 Blocker。

### 7.1 纯前端红线

- [ ] **所有改动不能引入任何后端服务器**（无自己写的 API route、无第三方 server 依赖）
- [ ] 数据持久化只能使用 `localStorage`（不得使用 IndexedDB 以外的浏览器存储引发用户不安）
- [ ] 不得植入任何分析/埋点/遥测脚本（Google Analytics、Umami 等）
- [ ] 外部 API 调用只允许用户**主动触发**的 AI 请求（连接用户明确选择的厂商）

### 7.2 隐私承诺

- [ ] UI 中是否始终保持了"纯本地、不登录、不入库"的承诺提示？
- [ ] 导出/复制的产物中是否不包含任何元数据/水印/追踪信息？
- [ ] 是否误引入了可追踪用户行为的网络资源？（CDN 字体、外部图片、第三方 CSS）

### 🔴 Blocker 示例

```javascript
// 🔴 严禁：引入外部分析脚本
// <script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>

// 🔴 严禁：将内容发送到非用户指定的服务器
// fetch('https://my-backend.com/api/save', { body: content })
```

---

## 8. 性能专项审查

### 8.1 渲染性能

- [ ] 大列表循环（如主题模板遍历）是否有关键 `:key`？
- [ ] `v-for` 与 `v-if` 是否在同一元素上混用？（应外层 `v-if`，内层 `v-for`）
- [ ] 频繁更新的 `computed` 是否缓存了计算结果？
- [ ] CSS 选择器是否过于深层？（超过 4 层选择器应简化）

### 8.2 内存泄漏

- [ ] `setInterval` 是否在 `onUnmounted` 中 `clearInterval`？
- [ ] `addEventListener` 是否在 `onUnmounted` 中 `removeEventListener`？
- [ ] Milkdown 编辑器是否在 `onUnmounted` 中调用 `.destroy()`？
- [ ] 大对象引用（如 `DEFAULT_CONTENT` 长字符串）是否在不需要时释放？

### 8.3 构建产物

- [ ] 新增依赖是否显著增大了构建产物体积？（当前 ~678 KB / 215 KB gzip）
- [ ] 是否有不必要的全量导入？（`import * from 'lodash'` → `import debounce from 'lodash/debounce'`）
- [ ] 静态 SVG 图标是否可以考虑 sprite 或内联？

---

## 9. CSS / 样式专项审查

净排的 UI 风格是"淡月光"设计语言，样式一致性至关重要。

### 9.1 CSS 变量

- [ ] 颜色值是否使用了 CSS 变量而非硬编码？（`color: var(--text-primary)` 而非 `color: #333`）
- [ ] 深色模式添加的 CSS 变量是否完整覆盖了所有新的 UI 元素？
- [ ] 新增变量是否在 `:root` / `:root[data-theme="dark"]` / `@media (prefers-color-scheme: dark)` 三处都有定义？

### 9.2 样式隔离

- [ ] 作用域样式 `scoped` 是否用于组件内样式？
- [ ] 全局样式是否有合理的命名空间前缀（如 `.milkdown-*`、`.shortcuts-*`、`.panel-*`）？
- [ ] 是否避免了 `!important`？（仅在覆盖第三方库样式时允许，且需注释原因）

### 9.3 响应式

- [ ] 750px / 1024px 两套断点是否都覆盖了新增元素？
- [ ] 移动端布局是否在窄屏下无溢出/重叠？
- [ ] `touch-action: none` 是否用于可拖拽元素防止手势冲突？

### 9.4 微信兼容

- [ ] 输出的文章 HTML 是否避免使用了微信不支持的 CSS？（如 `backdrop-filter`、CSS Grid）
- [ ] 内联样式是否格式正确（`<img style="...">` 而非 `<img style="...">` + 外部 `<style>`）
- [ ] 装饰元素是否使用了纯 CSS div 而非 SVG？（微信对 SVG 支持不稳定）

---

## 10. 工具标准化建议

### 10.1 推荐工具链（渐进式引入）

```jsonc
// package.json 新增 devDependencies
{
  "devDependencies": {
    "eslint": "^9.0.0",
    "eslint-plugin-vue": "^9.0.0",
    "prettier": "^3.0.0",
    "vitest": "^2.0.0",
    "@vue/test-utils": "^2.0.0",
    "jsdom": "^24.0.0"
  }
}
```

### 10.2 推荐 npm scripts

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src/ --ext .vue,.js",
    "lint:fix": "eslint src/ --ext .vue,.js --fix",
    "format": "prettier --write src/",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "npm run lint && npm run test && npm run build"  // CI gate
  }
}
```

### 10.3 推荐 ESLint 配置

```javascript
// eslint.config.js
export default [
  {
    files: ['src/**/*.{js,vue}'],
    rules: {
      // Vue 3 推荐规则
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],
      'vue/no-unused-refs': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      
      // 净排项目特有
      'no-console': ['warn', { allow: ['warn', 'error', 'assert'] }],
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
    }
  }
];
```

### 10.4 推荐 Prettier 配置

```jsonc
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "vueIndentScriptAndStyle": true
}
```

### 10.5 测试优先级

鉴于净排当前无测试，建议按以下优先级逐步覆盖：

| 优先级 | 测试目标 | 说明 |
|--------|---------|------|
| **P0** | `buildHtml()` | 核心排版管线，输出就是产品价值，替代手动预览验证 |
| **P0** | `callAI()` | 边界情况（空 key、超时、401/429）的逻辑覆盖 |
| **P1** | `THEMES` 数据 | 10 套主题的字段完整性、CSS 合成正确性 |
| **P1** | 装饰元素渲染 | `::: cover/divider/quote` 预处理和后处理 |
| **P2** | UI 组件渲染 | 工具栏面板打开/关闭、预览开关 |
| **P2** | 导入提纯 | Turndown 的 HTML → Markdown 转换正确性 |

---

## 11. PR 模板

```markdown
## 概述

<!-- 一句话描述这个 PR 做了什么 -->

## 改动范围

<!-- 逐项列出改动的文件和主要内容 -->

- `src/App.vue`: 新增了 xxx 功能 / 修复了 xxx bug
- `docs/xxx.md`: 更新文档

## 测试方法

<!-- 如何在本地验证改动 -->
1. 启动 `npm run dev`
2. 点击 xxx 按钮
3. 预期：xxx 行为
4. 实际：xxx 行为

## 审查重点

<!-- 提醒审查者特别关注的内容 -->

## 相关 Issue

<!-- Closes #xxx, Related to #xxx -->

## CHANGELOG

- [ ] 已更新 CHANGELOG.md
- [ ] 不涉及用户可见变化

## 隐私与安全

- [ ] 改动未引入任何后端依赖
- [ ] 所有用户输入已 sanitize
- [ ] 未新增外部网络请求
```

---

## 12. 审查回复格式

### 12.1 审查评论格式

```markdown
🔴 **Blocker: [分类] [简短标题]**
- **位置**: `src/App.vue:L1520`（`callAI` 函数内）
- **问题**: 描述问题的本质和触发条件
- **为什么**: 解释为什么这是个问题（安全风险？逻辑 bug？）
- **建议**: 给出具体的修复方向或代码示例

🟡 **Suggestion: [分类] [简短标题]**
- **位置**: `src/App.vue:L380-395`
- **问题**: ...
- **原因**: ...
- **建议**: ...

💭 **Nit: [分类] [简短标题]**
- **位置**: ...
- **建议**: ...
```

### 12.2 审查总结格式

```markdown
## 审查总结

### 总体评价
改动合理，逻辑正确，整体质量良好。

### 🔴 Blockers（0）
无

### 🟡 Suggestions（2）
1. 变量 `x` 命名不够清晰，建议改为 `y`
2. 缺少边界情况 `z` 的处理

### 💭 Nits（1）
1. 注释多余，可删除

### 评分
| 维度 | 评分 | 说明 |
|------|:----:|------|
| 正确性 | ⭐⭐⭐⭐ | 核心逻辑正确，边界需强化 |
| 安全性 | ⭐⭐⭐⭐⭐ | 无新风险 |
| 可维护性 | ⭐⭐⭐ | 命名和注释有提升空间 |
| 性能 | ⭐⭐⭐⭐ | 无性能隐患 |
| 测试 | — | 尚未纳入测试 |

### 结论
✅ **Approved**（处理完 🟡 后合并）
```

---

## 13. 验收标准

### 13.1 审查完成标准

- [ ] 所有 🔴 Blocker 已关闭或 resolved
- [ ] 所有 🟡 Suggestion 至少讨论过（不一定要改）
- [ ] PR 描述填写完整
- [ ] CHANGELOG.md 已更新
- [ ] `vite build` 零错误
- [ ] 本地已验证功能

### 13.2 合规红线（一票否决）

以下情况直接打回，无需继续审查：

- **引入后端服务器**或联网上传用户内容
- **XSS 漏洞**（未 sanitize 用户输入直接 innerHTML）
- **破坏 localStorage 数据兼容性**导致用户草稿丢失
- **新增外部分析/埋点脚本**
- **直接修改了 `dist/` 目录下的构建产物**（必须走源码修改→`vite build`）

---

## 附录：净排代码库当前质量快照

| 维度 | 现状 | 评价 |
|------|------|------|
| 文件架构 | 单文件 `App.vue`（3273 行） | 🟡 建议拆分 |
| 测试覆盖 | 无 | 🔴 需引入 |
| Lint/Format | 无 | 🟡 建议引入 |
| 依赖数量 | 8 个（极精简） | ✅ 优秀 |
| 错误处理 | 基本覆盖 | 🟡 有提升空间 |
| 隐私安全 | 优秀（纯本地） | ✅ 核心竞争力 |
| 代码注释 | 关键坑点有注释 | ✅ 良好 |
| 文档 | 设计文档详尽 | ✅ 优秀 |

---

> 📐 **净排** · 纯本地 · 不登录 · 文章不出本机，排版照样好看。
