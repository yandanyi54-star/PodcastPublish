# Milkdown 迁移方案（v0.9.0 规划）

> 状态：方案已确认，待执行（v1.1 修订：修正 `:::` 语法假设、Git 备份策略、包名版本）
> 日期：2026-07-14（初稿）/ 2026-07-15（修订）
> 背景：用户反馈「编辑区写源码、预览区看效果」的割裂感不丝滑，期望所见即所得
> 可行性评估：[milkdown-feasibility-assessment.md](./milkdown-feasibility-assessment.md)

---

## 一、问题诊断

### 现状架构

```
编辑器（md-editor-v3 / Codemirror）     预览面板（手机模拟器）
┌─────────────────────────┐           ┌──────────────────────┐
│ # 标题                  │  ────→   │ 标题（大字号紫色）   │
│ ::: cover               │  ────→   │ ═══════════════════  │
│ 点击编辑文字            │  ────→   │    点击编辑文字      │
│ :::                     │  ────→   │ ═══════════════════  │
│ > 引用                  │  ────→   │ ▎引用               │
└─────────────────────────┘           └──────────────────────┘
   左边写代码                              右边看效果
```

### 核心问题

1. **两套表示系统**：编辑器显示 Markdown 源码，预览显示渲染结果，用户需要在大脑里做翻译
2. **自定义语法不可见**：`::: cover` 在 Codemirror 里是普通灰色文本，没有任何视觉提示
3. **预览重复**：预览面板的作用和编辑器重复，且不能直观协同编辑
4. **md-editor-v3 架构限制**：底层是 Codemirror（纯文本编辑器），只高亮标准 Markdown 语法，永远不会渲染效果——换什么参数都解决不了

### 目标架构

```
┌──────────────────────────────────┐
│  标题（大字号紫色）              │  ← 直接在这里编辑
│  ═══════════════════             │
│     点击编辑文字                 │  ← 光标直接点进去改
│  ═══════════════════             │
│  ▎引用                          │
└──────────────────────────────────┘
   所见即所得，没有"翻译"
```

---

## 二、迁移策略：渐进式替换，保留 buildHtml 管线

核心原则：**编辑器换掉，复制管线不动。**

```
现状：  markdownText → buildHtml() → previewHtml → 手机预览面板
                                          ↓
                                     复制/导出

迁移后：Milkdown 编辑器（WYSIWYG，主题 CSS 注入）
            ↓ getMarkdown()
        buildHtml() → DOMPurify → 复制/导出
```

Milkdown 的 `getMarkdown()` 返回标准 Markdown，现有 `buildHtml` 函数（含容器语法预处理、三层级联配色、样式注入、表格斑马、嵌套列表）**完全复用，零改动**。复制到微信的效果和现在一模一样，只是编辑体验变了。

---

## 三、核心竞争力影响分析

| 竞争力 | 本质 | 换 Milkdown 后 |
|--------|------|---------------|
| **隐私安全**（纯本地、不登录、内容不入库） | 架构层面：无后端、无网络请求、localStorage 存储 | ✅ 不受影响。Milkdown 是纯前端 JS 库 |
| **AI 能力**（用户自带 key） | 架构层面：浏览器直连 LLM API | ✅ 不受影响。AI 操作的是文本，跟编辑器无关 |
| **一键复制到微信** | 管线层面：markdown → buildHtml → DOMPurify → 剪贴板 | ✅ 可保留。Milkdown 有 `getMarkdown()` API，现有 buildHtml 管线完全复用 |

**结论：三个核心竞争力全在架构层面，没有一个绑定在编辑器组件上。换编辑器是 UX 决策，不是架构决策。**

### 竞品格局对比

| 工具 | 编辑方式 | 需要登录 | 内容入库 |
|------|---------|---------|---------|
| 秀米 / 135编辑器 | 可视化拖拽 | 是 | 是 |
| 壹伴 | 浏览器插件 | 是 | 是 |
| mdnice（墨滴） | 源码 + 预览 | 是 | 是 |
| **净排（现状）** | 源码 + 预览 | **否** | **否** |
| **净排（换 Milkdown）** | 所见即所得 | **否** | **否** |

换 Milkdown 后，净排将成为**唯一一个纯本地、不登录、所见即所得的公众号排版工具**。

---

## 四、四个迁移阶段

### Phase 1：编辑器替换（核心）

| 改动 | 说明 |
|------|------|
| 安装依赖 | `@milkdown/kit` `@milkdown/vue` `remark-directive`（`:::` 语法往返必需） |
| 删除依赖 | `md-editor-v3`（+ 其 CSS） |
| 替换 `<MdEditor>` 组件 | L476-481 → `<Milkdown :editor="editor" />`，用 `useEditor` composable 管理 |
| 数据绑定 | `v-model="markdownText"` → listener 插件 `markdownUpdated` 回调同步到 `markdownText` ref；外部写入用 `editor.action(replaceAll(md))` |
| getMarkdown 实现 | Kit API 无快捷方法，需手动实现：`editor.action((ctx) => ctx.get(serializerCtx)(ctx.get(editorViewCtx).state.doc))` |
| 主题 CSS 注入 | 编辑器内容区域注入主题样式：h1-h6/p/blockquote/ul/ol 等的 CSS 规则，从 `THEMES` 对象生成 `<style>` 块 |
| 手机框嵌入 | Milkdown 编辑器放入现有 `.phone-content` 容器内，宽度受手机框约束 |

**主题 CSS 注入的关键**：当前 `THEMES` 对象存的是内联 style 字符串（如 `h1: 'font-size:24px;color:#534AB7'`）。需要新增一个 `themeToCss(theme)` 函数，把 23 个标签的 style 字符串转成 CSS 规则，注入到 Milkdown 的 `.milkdown` 内容区。这样编辑器里看到的效果就和 buildHtml 输出的内联样式一致。

### Phase 2：自定义节点插件（装饰元素）

| 改动 | 说明 |
|------|------|
| remark-directive 插件 | `$remark` 注册 `remark-directive`，解析 `:::` 语法为 AST directive 节点（commonmark 默认不识别 `:::`） |
| 封面节点 | `$nodeSchema('cover')` 定义 → parseMarkdown/toMarkdown runner → toDOM 渲染上下边线 + 可编辑标题 |
| 金句节点 | 同理，`$nodeSchema('quote')` → styled section 渲染 |
| 分割线 | `$nodeSchema('divider')` → atom node → `※ ※ ※` 字符渲染 |
| `::: container` 预处理 | buildHtml 中的正则保留（复制管线仍需要），编辑器内由 node view 直接渲染，用户不再看到 `:::` 源码 |

**前置依赖：Phase 0 POC H1.5 必须通过。** `:::` 语法在 Milkdown commonmark 默认配置下**不会往返**（会解析为普通段落文本），必须引入 `remark-directive` + 自定义 node schema。这是 POC 最关键的验证项。ProseMirror 的 schema 定义、输入规则（input rule）、节点视图（node view）需要约 200-250 行代码。但好处是：用户在编辑器里直接看到封面卡片的样子，点击就能编辑标题文字，不再是三行灰色 `:::` 文本。

### Phase 3：工具栏与交互适配

> **v1.1 修订**：spec 将 plan 的 Phase 2（节点插件）+ Phase 3（工具栏适配）合并为 spec Phase 2。以下保留原始描述供参考，执行以 spec 为准。

| 改动 | 说明 |
|------|------|
| `insertDecorBlock` | 从「操作 textarea selectionStart」改为「Milkdown editor command 插入节点」 |
| `insertImageByUrl` | 从「追加 `![](url)` 到末尾」改为「Milkdown 插入 image 节点到光标处」 |
| AI 写入 | `markdownText.value = result` → `editor.action(replaceAll(result))` |
| 导入提纯 | Turndown 结果 → `editor.action(replaceAll(md))` |
| 清除内联样式 | 操作 `markdownText` → 操作 editor DOM 或 getMarkdown/replaceAll |

### Phase 4：布局简化 + 清理

> **v1.1 修订**：spec 将此阶段编号为 Phase 3。执行以 spec 为准。

| 改动 | 说明 |
|------|------|
| 删除独立预览面板 | `.preview-section` / `.phone-frame` / `previewHtml` / `showPreview` / `previewPosition` / `previewWidth` / 拖拽分隔线 |
| 手机框保留 | 作为 Milkdown 编辑器的容器，保留微信顶栏模拟 |
| 删除 `convertMarkdown` / `renderHtml` 中的预览逻辑 | 保留 buildHtml 用于复制/导出 |
| 删除 `marked` 依赖？ | **不删**。buildHtml 仍需要 marked 解析 Markdown。但可以考虑用 Milkdown 自带的 remark parser 替代（省一个依赖） |

---

## 五、保留不动的部分

| 模块 | 行号 | 为什么不动 |
|------|------|-----------|
| `THEMES` 对象 | L737-1036 | 10 套主题定义，buildHtml 和编辑器 CSS 共用 |
| `buildHtml` 函数 | L1010-1127 | 复制/导出的核心管线，Milkdown 的 getMarkdown 喂给它 |
| `_brandShade` | L1226-1263 | 颜色派生工具函数 |
| `buildCoverBlock` / `buildDividerBlock` / `buildQuoteSection` | L1265-1280 | buildHtml 后处理调用，生成微信兼容 HTML |
| `callAI` | L1469-1510 | 纯 API 调用，和编辑器无关 |
| AI 功能函数 | L1512-1561 | 读取 markdownText（改用 getMarkdown），写入用 replaceAll |
| 品牌色 / 字体系统 | L1202-1222 | 逻辑不变 |
| 自定义覆盖项 | L1147-1177 | 逻辑不变，覆盖项同时注入编辑器 CSS 和 buildHtml |
| localStorage 持久化 | 各处 | key 不变，值不变 |

---

## 六、风险与对策

| 风险 | 严重度 | 对策 |
|------|--------|------|
| **`:::` 语法默认不往返** | 高 | commonmark 不识别 directive 语法。必须引入 `remark-directive` + 自定义 node schema。POC H1.5 验证此方案可行性，失败则需替代设计 |
| **编辑器 CSS ≠ buildHtml 内联样式** | 高 | `themeToCss()` 函数和 `buildHtml` 的样式注入共用同一份 `THEMES` 数据源，保证一致性。偏差只可能在浏览器默认样式覆盖上出现，通过 CSS reset 消除 |
| **ProseMirror 插件开发复杂** | 高 | 分割线先用标准 `---`（不写插件），封面/金句先出 MVP（只渲染、不编辑），迭代加可编辑能力 |
| **包体积增大** | 中 | Milkdown kit + vue + remark-directive ≈ 200KB gzip。md-editor-v3 ≈ 120KB gzip。增量 80KB，对纯本地工具可接受 |
| **Milkdown 中文输入法兼容** | 中 | ProseMirror IME 光标跳行 bug 已在 2024-12 修复（PR #1568）。若仍有问题，过滤 `syncHeadingIdPlugin`。Vue 环境比 React 稳定 |
| **AI replaceAll 丢失光标位置** | 低 | `replaceAll` 后将光标移到文末。AI 生成标题场景可更精确（只替换 h1 行） |

---

## 七、工程量估算

| 阶段 | 改动 | 预估行数 |
|------|------|---------|
| Phase 1 | 编辑器替换 + 主题 CSS 注入 + listener | +180 / -80 |
| Phase 2 | remark-directive + 装饰节点插件 + 工具栏适配 | +280 / -50 |
| Phase 3 | 布局简化 + 预览面板删除 | +20 / -120 |
| **合计** | | **净增约 230 行** |

现有 App.vue 2743 行，迁移后约 2970 行。仍然在单文件可控范围内。

---

## 八、建议执行顺序

> **v1.1 修订**：原计划建议"Phase 1 + Phase 4 一起做"，spec 已改为保留预览面板做对照。执行顺序以 spec 为准。

**先做 Phase 0（POC）**——用最小工程量验证核心假设，特别是 H1.5（remark-directive 方案能否实现 `:::` 往返）。如果 H1.5 失败，整个迁移方案需要重新设计装饰元素的编辑器表示方式。

**Phase 1（编辑器替换，保留预览面板）**——验证"编辑器即预览"的基础体验是否达到预期。预览面板作为对照工具，逐元素对比 WYSIWYG 渲染和 buildHtml 输出。

**Phase 2（装饰节点 + 工具栏适配）**——基于 POC H1.5 的验证成果，集成 remark-directive + 自定义 node 到生产代码。这是工程量最大的阶段。

**Phase 3（移除预览面板）**——确认所有功能稳定后，删除预览面板，简化布局。

这样做的核心逻辑：**每个 Phase 都有明确的验证目标，前一个 Phase 的结论决定后一个 Phase 是否启动。**

---

## 九、Milkdown 依赖清单

```json
{
  "@milkdown/kit": "^7.17.0",
  "@milkdown/vue": "^7.17.0",
  "remark-directive": "^3.0.0"
}
```

删除：
```json
{
  "md-editor-v3": "^4.x"
}
```

> `@milkdown/kit` 是 v7 推荐的伞包，re-export 了 core / preset-commonmark / preset-gfm / utils / prose 等子模块。原计划列的 5 个独立分包（`@milkdown/core` 等）是 v6 风格，v7 已统一为 `@milkdown/kit`。listener 插件已内置在 kit 中（`@milkdown/kit/plugin/listener`），无需单独安装。
>
> `remark-directive` 是 `:::` 容器语法往返的核心依赖，不可省略。

---

## 十、关键 API 速查

| 操作 | md-editor-v3 | Milkdown (Kit API) |
|------|-------------|----------|
| 获取 Markdown | `v-model` 双向绑定 | `editor.action((ctx) => ctx.get(serializerCtx)(ctx.get(editorViewCtx).state.doc))` 或 listener `markdownUpdated` 回调 |
| 设置 Markdown | `markdownText.value = md` | `editor.action(replaceAll(md))` |
| 获取 HTML | N/A（用 buildHtml） | `editor.dom` 或 `editor.action(getHTML())` |
| 插入内容到光标 | 操作 textarea `selectionStart` | `editor.action(insert('text'))` |
| 插入自定义节点 | N/A | `editor.action(insertNode('cover'))` 或通过 input rule 触发 |
| 监听内容变化 | `v-model` 自动 | `listener` 插件 + `ctx.get(listenerCtx).markdownUpdated(cb)` |
| 主题样式注入 | buildHtml 内联 style | `themeToCss()` → `<style>` 注入 `.milkdown` 容器 |

---

## 附：当前文件结构参考

```
src/App.vue (2743 行)
├── <template>
│   ├── 工具栏 (L30-90)
│   ├── 预览区 (L422-462) ← Phase 3 删除
│   ├── 编辑器区 (L474-486) ← MdEditor 在 L476-481
│   └── 悬浮面板们 (L90-460)
├── <script setup>
│   ├── imports (L504-509)
│   ├── 状态定义 (L590-650)
│   ├── buildHtml (L1024-1133) ← 保留不动
│   ├── THEMES (L737-1021) ← 保留不动
│   ├── 装饰函数 (L1265-1313) ← 保留不动 / Phase 2 适配插入逻辑
│   ├── AI 函数 (L1475-1516) ← Phase 2 适配
│   └── 工具栏函数 (L1315-1345) ← Phase 2 适配
└── <style>
    ├── 编辑器样式 ← Phase 1 重写
    └── 预览面板样式 ← Phase 3 删除
```

> 行号基于 v0.8.2 基线（2743 行）。执行前请 `wc -l src/App.vue` 校准。
