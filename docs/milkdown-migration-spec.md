# Milkdown 迁移技术规格书（Spec）

> 版本：v1.1 · 日期：2026-07-15 · 状态：**计划评审，尚未执行**
>
> 关联文档：[原始方案草案](./milkdown-migration-plan.md)（2026-07-14）· [可行性评估报告](./milkdown-feasibility-assessment.md)（2026-07-15）
>
> v1.1 变更：修正 Git 备份策略、`:::` 语法往返假设、getMarkdown API 实现、包名版本号、Phase 2 工程量估算

---

## 0. 安全策略 —— 先读这节

### 为什么需要安全策略

项目已有 Git 仓库（`git@github.com:yandanyi54-star/jingpai.git`），当前 HEAD 有 `v0.8.2: 当前稳定版本备份 — 迁移前基线` commit。Milkdown 迁移涉及核心编辑器替换，用 Git 分支管理迁移过程比手动 `cp -r` 更安全、更轻量。

### 三步安全网

```
第 1 层：迁移分支         第 2 层：增量检查点        第 3 层：即时回滚
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│ git checkout  │  →   │ 每个 Phase 完  │  →    │ 任何阶段失败  │
│ -b migration/ │       │ 成后 git add+  │       │ → git reset   │
│ milkdown      │       │ commit，npm    │       │   --hard 回到 │
│ 确保主分支不动│       │ build 成功才继 │       │   上一个 commit│
│              │       │ 续下一阶段     │       │              │
└──────────────┘       └──────────────┘         └──────────────┘
```

**具体操作**：
```bash
# 创建迁移分支（在主分支 main/master 上）
git checkout -b migration/milkdown

# 每个 Phase 完成后
git add -A && git commit -m "phase N: 描述"
npm run build  # 构建不报错且零 warning 才进入下一 Phase

# 如果构建失败 3 次以上或出现难以排查的运行时异常 → 回滚
git reset --hard HEAD~1  # 回到上一个 Phase 的 commit
# 或完全放弃迁移
git checkout main  # 回到主分支，迁移分支保留以备复盘
```

### 为什么用 git 而不是手动 cp -r

项目已经初始化了 Git，有完整的 commit 历史和远程备份（GitHub）。用分支管理迁移：
- 每个 Phase 一个 commit，出问题 `git reset --hard` 一步到位
- 不需要 `cp -r` 整个项目目录（含 node_modules，慢且占空间）
- 迁移完成后合并分支即可，失败则直接切回主分支，干净利落
- 远程仓库本身就是额外备份层

---

## 一、背景与动机（为什么做这个迁移）

### 当前痛点

净排 v0.8.2 使用 `md-editor-v3`（底层是 CodeMirror 纯文本编辑器），用户看到的是 Markdown 源码：

```
编辑器显示：                   预览面板显示：
# 标题                       标题（大字号紫色）
::: cover                     ═══════════════
点击编辑文字                   点击编辑文字
:::                           ═══════════════
```

用户在脑子里做"源码 → 效果"的翻译。自定义语法 `::: cover` 在编辑器里是灰色纯文本（无任何视觉提示），体验割裂。

### 迁移目标

把净排变成**国内唯一一个纯本地、不登录、所见即所得的公众号排版工具**。

### 为什么选 Milkdown 而不是其他方案

| 方案 | 为什么否决 |
|------|-----------|
| 给 md-editor-v3 加自定义语法高亮 | 它的底层 CodeMirror 是纯文本编辑器，永远不会渲染成 WYSIWYG 效果，换什么配置都解决不了核心问题 |
| TipTap (Vue) | 也是 ProseMirror 封装，但 Markdown 导入/导出需额外处理，生态不如 Milkdown 对 Markdown 原生友好 |
| Milkdown | **专门为 Markdown WYSIWYG 设计**，底层同是 ProseMirror，自带 Markdown 往返能力（通过 serializer 实现），与我们"管道不变"的策略完美契合 |

### 为什么用"换编辑器，保管线"策略

净排的核心价值在**管线**（buildHtml → DOMPurify → 微信复制），不在编辑器。这个策略把迁移风险限制在编辑体验层，不动复制管线。Milkdown 的 `getMarkdown()`（Kit API 下需用 `serializer + editorView` 手动实现，详见 Phase 1）输出标准 Markdown 喂给 `buildHtml()`，同一个函数、同一份 THEMES 数据、同一个 DOMPurify，复制到微信效果完全一样。

---

## 二、迁移流程总览

```
┌─ Phase 0 ─────┐   ┌─ Phase 1 ─────┐   ┌─ 检查点 1 ─┐
│ Git分支 + POC  │ → │ 编辑器替换    │ → │ build通过? │
│ 验证4个核心   │   │ 保留预览面板  │   └──────┬─────┘
│ 假设(H1/H1.5/ │   │ 作为对照工具  │          │ ✅继续
│ H2/H3)        │   └───────────────┘          │ ❌修/回滚
└───────────────┘                               ↓
┌─ Phase 2 ──────────┐   ┌─ 检查点 2 ─┐   ┌─ Phase 3 ─────┐
│ A: 装饰节点插件    │ → │ build通过? │ → │ 移除预览面板  │
│ B: 工具栏适配      │   │ 功能回归?  │   │ 布局简化      │
│ remark-directive   │   └──────┬─────┘   └───────────────┘
│ + node schema      │          │ ✅继续
└────────────────────┘          │ ❌修/回滚
                                 ↓
                          ┌─ 检查点 3 ─┐
                          │ 完整验收    │
                          │ 合并分支    │
                          │ v0.9.0 ✅  │
                          └────────────┘
```

**关键设计决策：Phase 1 保留预览面板**

原始计划建议"Phase 1 + Phase 4 一起做"（替换编辑器同时删掉预览面板）。我改成了**先替换编辑器但保留预览面板**。

为什么？因为这样预览面板就成了一个**对照验证工具**：左边 Milkdown 编辑器是 WYSIWYG 渲染，右边预览面板是 buildHtml 输出，你可以逐行对比两者的差异。发现不一致就知道是 themeToCss 的问题。把对照工具删了再排查问题等于蒙着眼调色。

---

## 三、Phase 0：创建迁移分支 + POC 验证（预计 1-2 小时）

### 做什么

**Step 0A — 创建迁移分支：**
```bash
# 确认当前在主分支且工作区干净
git status

# 确认 vite build 能通过
npm run build

# 创建迁移分支
git checkout -b migration/milkdown

# 记录当前 App.vue 行数（后续行号引用的基准）
wc -l src/App.vue  # 当前 2743 行
```

**Step 0B — POC 验证（在临时目录做，不影响项目代码）：**

在临时目录做 4 个最小验证，确认 Milkdown 能满足净排的核心需求，**再决定是否执行迁移**。

> **重要修正（v1.1）**：原始 H1 假设"默认往返正常"是错误的。Milkdown 的 commonmark 预设**不识别** `:::` directive 语法，会将其解析为普通段落文本。必须引入 `remark-directive` 插件 + 自定义 node 才能实现往返。因此 POC 拆分为 H1（验证默认失败）和 H1.5（验证 remark-directive 方案）两步。

需要验证的 4 个假设：

| # | 假设 | 验证方法 | 通过标准 |
|---|------|---------|---------|
| H1 | `::: container` 默认不往返（预期失败） | 在 Milkdown 中输入 `::: cover\n标题\n:::`，调用 `getMarkdown()`，对比输入输出 | 确认输出**不是**原样保留（段落文本拼接或换行丢失）→ 证实需要自定义插件 |
| H1.5 | `remark-directive` + 自定义 node 可实现往返 | 引入 `remark-directive`，定义 cover/divider/quote 三个 node schema（parseMarkdown + toMarkdown），输入 `::: cover\n标题\n:::` → `getMarkdown()` | 输出与输入字符完全一致（含换行），且编辑器内渲染为卡片样式 |
| H2 | 中文输入法兼容 | 用搜狗/微软拼音在编辑器内输入一段中文，含换行和格式 | 候选框位置不跳动、确认后光标不偏移（若出现跳行，尝试过滤 `syncHeadingIdPlugin`） |
| H3 | 主题 CSS 可注入 | 写一个最小 `themeToCss()`，把 `h1: 'font-size:24px;color:#534AB7'` 转为 CSS 注入 `.milkdown` 容器 | h1 渲染效果与 buildHtml 对比肉眼一致 |

### H1.5 验证代码参考

```javascript
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { $remark } from '@milkdown/kit/utils'
import { $nodeSchema } from '@milkdown/kit/utils'
import directive from 'remark-directive'

// 1. 引入 remark-directive 解析 ::: 语法
const remarkDirective = $remark('remark-directive', () => directive)

// 2. 定义 cover node schema
const coverSchema = $nodeSchema('cover', () => ({
  content: 'text*',
  group: 'block',
  defining: true,
  attrs: { type: { default: 'cover' } },
  parseMarkdown: {
    match: (node) => node.type === 'containerDirective' && node.name === 'cover',
    runner: (state, node, type) => { state.openNode(type).next(node.children).closeNode() },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'cover',
    runner: (state, node) => { state.openNode('containerDirective', { name: 'cover' }).next(node.content).closeNode() },
  },
}))
// divider、quote 同理

// 3. 创建编辑器并验证往返
const editor = await Editor.make()
  .config((ctx) => { ctx.set(rootCtx, root); ctx.set(defaultValueCtx, '::: cover\n标题\n:::') })
  .use(remarkDirective).use(coverSchema).use(commonmark).create()

// 4. getMarkdown（Kit API 需手动实现）
const md = editor.action((ctx) => {
  const serializer = ctx.get(serializerCtx)
  const view = ctx.get(editorViewCtx)
  return serializer(view.state.doc)
})
console.log(md) // 应输出 ::: cover\n标题\n:::
```

### 为什么先做 POC

这是整个迁移的**唯一一次免费试错机会**。在临时目录做验证，不碰项目代码。如果 H1.5 或 H2 失败，直接放弃迁移方案，零损失。

H1.5 是**最关键的假设**——如果 `remark-directive` + 自定义 node 不能实现 `:::` 往返，"换编辑器、保管线"策略就在装饰元素上破了，需要重新设计装饰元素的编辑器内表示方式。

### 失败处理

- H1 失败（默认往返成功）→ 意外之喜，跳过 H1.5 直接进 Phase 1
- H1.5 失败 → 尝试替代方案：编辑器内用标准 blockquote + CSS 标记，buildHtml 管线做语法转换；若替代方案也不可行则放弃
- H2 失败 → 尝试过滤 `syncHeadingIdPlugin`：`editor.use(commonmark.filter(x => x !== syncHeadingIdPlugin))`；若仍失败则放弃
- H3 失败 → 调整 themeToCss 实现直到匹配，这是可修的问题

### 不可跳过的理由

如果跳过 POC 直接改 App.vue，H1.5 失败意味着已经改了上百行代码才发现路线走不通，白费功夫。H1.5 验证的 remark-directive 方案是 Phase 2 装饰节点插件的基础，必须先确认可行。

---

## 四、Phase 1：编辑器替换（预计 2-3 小时）

### 前置条件：Phase 0 全部假设通过

### 做什么

**改动范围：**

| 文件 | 改动 | 说明 |
|------|------|------|
| `package.json` | 依赖变更 | 删 `md-editor-v3`，加 `@milkdown/kit` + `@milkdown/vue` |
| `src/App.vue` | import + 模板 + 逻辑 | 核心改动，详见下方 |
| `vite.config.js` | 可能不需改 | Milkdown 是纯 ESM，Vite 原生支持 |

**App.vue 改动明细：**

```diff
# <script setup> 变化：
- import { MdEditor } from 'md-editor-v3'
- import 'md-editor-v3/lib/style.css'
+ import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/kit/core'
+ import { commonmark } from '@milkdown/kit/preset/commonmark'
+ import { gfm } from '@milkdown/kit/preset/gfm'
+ import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
+ import { insert, replaceAll } from '@milkdown/kit/utils'
+ import { Milkdown, useEditor } from '@milkdown/vue'
+ # 不引入 @milkdown/theme-nord（冲突风险，我们用自写主题 CSS）

# <template> 变化：
  <!-- 原 MdEditor（L476-481）替换为 -->
- <MdEditor ref="editorRef" v-model="markdownText" ... />
+ <Milkdown :editor="editor" />

# 新增函数：
+ const themeToCss = (themeKey) => { ... }  // THEMES 数据 → CSS 规则字符串
+ const injectThemeCss = () => { ... }       // 注入到 .milkdown 内容区

# getMarkdown 实现（Kit API 无快捷方法，需手动实现）：
+ const getMarkdown = (editor) => editor.action((ctx) => {
+   const serializer = ctx.get(serializerCtx)
+   const view = ctx.get(editorViewCtx)
+   return serializer(view.state.doc)
+ })

# 双向数据绑定改造：
  // 原：v-model="markdownText"（MdEditor 原生支持）
  // 新：listener 插件监听变化 → markdownText.value = getMarkdown(editor)
  //    外部写入 → editor.action(replaceAll(md))
  //
  // 编辑器初始化时注册 listener：
+ editor.use(listener).config((ctx) => {
+   ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
+     if (markdown !== prevMarkdown) markdownText.value = markdown
+   })
+ })
```

**预览面板暂不删除：**
- 保留 L421-462 的 `.preview-section` 和 `.phone-frame`
- 保留 L596 的 `previewHtml` 和 L524 的 `showPreview`
- 保留 L1141-1149 的 `renderHtml()` 逻辑

### 为什么保留预览面板

预览面板此时的作用从"给用户看的"变成"给你（开发者）看的对照工具"。你可以同时看到 Milkdown 的 WYSIWYG 渲染和 buildHtml 的输出，逐元素对比差异。等确认两个渲染一致后再删。

### 为什么自写主题 CSS 而不是用 @milkdown/theme-nord

1. nord 有自己的 h1-h6/p/blockquote 样式，会和你的 10 套主题冲突
2. 用 `themeToCss` 直接从 THEMES 对象生成 CSS，确保和 buildHtml 的同源一致
3. 少一个依赖，少一个版本冲突点

### 成功标准

1. `npm run build` 零错误
2. 在浏览器中打开：Milkdown 编辑器正常显示，可以输入 Markdown 并渲染为 WYSIWYG
3. 打开预览面板：预览面板的渲染结果（buildHtml）与编辑器内的 WYSIWYG 渲染**肉眼一致**（至少 h1/h2/p/blockquote/列表的颜色、字号、间距一致）
4. `::: cover` 语法输入后，`getMarkdown()` 能原样输出（验证 POC H1.5 结论在生产代码中仍然成立）
5. 复制 HTML 到微信：格式与 v0.8.2 一致

### 失败处理

- 编辑器无法初始化 → 检查 Milkdown 版本、Vue 插件注册方式
- WYSIWYG 与预览不一致 → 调 themeToCss，增加 CSS reset 覆盖
- 构建报错 → 排查 ESM/CJS 兼容问题
- `:::` 语法往返失败 → 确认 remark-directive 插件和 node schema 已正确注册

如果 3 次修复仍不能通过全部成功标准 → `git reset --hard` 回到 Phase 0 commit。

---

## 五、Phase 2：装饰节点插件 + 工具栏适配（预计 3-4 小时）

### 前置条件：Phase 1 全部成功标准通过，且 POC H1.5 已验证 remark-directive 方案可行

### 做什么

Phase 2 分为两部分：**A. 装饰节点插件开发**（基于 POC H1.5 的验证成果）和 **B. 工具栏函数适配**。

### A. 装饰节点插件开发（+200~250 行）

将 POC H1.5 中验证的 remark-directive + 自定义 node 方案集成到 App.vue：

| 改动 | 说明 |
|------|------|
| 引入 `remark-directive` | `$remark` 插件注册，解析 `::: type` 语法为 AST directive 节点 |
| 定义 cover node schema | `$nodeSchema('cover')` — content: `text*`，parseMarkdown/toMarkdown runner，toDOM 渲染上下边线 + 居中标题 |
| 定义 divider node schema | `$nodeSchema('divider')` — atom: true，toDOM 渲染 `※ ※ ※` 字符 |
| 定义 quote node schema | `$nodeSchema('quote')` — content: `block+`，toDOM 渲染 styled section |
| 定义 input rule | `::: cover` / `::: divider` / `::: quote` 输入触发节点创建 |
| node view 渲染 | 编辑器内渲染效果与 buildHtml 输出的 buildCoverBlock / buildDividerBlock / buildQuoteSection 视觉一致 |
| 编辑器初始化注册 | `editor.use(remarkDirective).use(coverSchema).use(dividerSchema).use(quoteSchema)` |

**关键：node view 的 toDOM 渲染要与 buildHtml 输出一致。** 编辑器里看到的封面卡片样式（上下边线、居中标题、品牌色）应该和复制到微信后的效果一致。可以从 THEMES 对象和品牌色派生样式，与 buildCoverBlock 共用配色逻辑。

### B. 工具栏函数适配（+60~80 行 / -40 行）

把 5 个直接操作编辑器文本的函数从"操作 textarea/ref"改为"操作 Milkdown editor"：

| 函数 | 原实现 | 新实现 | 为什么 |
|------|--------|--------|--------|
| `insertDecorBlock()` (L1288) | 操作 `editorRef.$el.querySelector('textarea').selectionStart` | `editor.action(insert('::: cover\n点击编辑文字\n:::'))` 插入到光标处 | Milkdown 没有 textarea，用 ProseMirror 事务插入；插入后 node view 自动渲染为卡片 |
| `insertImageByUrl()` (L1315) | `markdownText.value += '![](url)'` 追加到末尾 | `editor.action(insert('![](url)'))` 插入到光标处 | 修复旧行为（只能追加到末尾），同时适配新编辑器 |
| `callAI()` 和 AI 写入 (L1475) | `markdownText.value = result` 全量替换 | `editor.action(replaceAll(result))` | Milkdown 不能直接赋值 ref 来更新内容 |
| 导入提纯 `doImport()` | 同 AI 写入 | 同 AI 写入 | 同上 |
| `clearInlineStyles()` (L1332) | 操作 `markdownText.value`，正则 strip style/class | 先 `getMarkdown(editor)` 再 strip 再 `editor.action(replaceAll(txt))` | 操作对象从 DOM 变成文本流 |

### 为什么 Phase 2 放在 Phase 1 之后

节点插件和工具栏改动都依赖 Milkdown 已经正确初始化。先把编辑器换上去、确认基础渲染没问题了，再集成装饰节点和适配工具栏函数，出问题时排查范围极小。

### 成功标准

**A. 装饰节点：**
1. `npm run build` 零错误
2. 在编辑器内输入 `::: cover` + 换行 + 文字 + 换行 + `:::` → 自动渲染为封面卡片（上下边线 + 居中标题）
3. `::: divider` → 渲染为 `※ ※ ※` 分割线
4. `::: quote` → 渲染为金句卡片（带背景色和左边框）
5. 装饰节点在编辑器内的渲染效果与预览面板 buildHtml 输出肉眼一致
6. `getMarkdown()` 输出保留 `::: type\n内容\n:::` 原始语法

**B. 工具栏：**
7. 点击"封面卡片"按钮 → 编辑器光标处正确插入封面节点
8. 点击"分割线"按钮 → 插入分割线节点
9. 点击"金句卡片"按钮 → 插入金句节点
10. 粘贴图片 URL → 编辑器内插入 `![](url)`
11. AI 生成标题 → 结果替换编辑器内容（光标在文末）
12. 导入提纯 → 结果替换编辑器内容
13. 清除内联样式 → 正常工作

### 失败处理

- 节点 schema 注册失败 → 检查 `$nodeSchema` 的 parseMarkdown match 逻辑，确认 remark-directive 输出的 AST 节点类型
- node view 渲染不一致 → 调 toDOM 输出的 HTML 结构和样式，与 buildCoverBlock 对比
- 单个工具栏函数失败 → 只回滚该函数（`git checkout -- src/App.vue` 后手动恢复），其他函数的改动不受影响
- 多个函数均失败 → 检查 editor 实例的上下文注入方式，可能是 useEditor 未正确返回 editor 实例

---

## 六、Phase 3：移除预览面板（预计 30 分钟）

### 前置条件：Phase 2 全部通过，且 Phase 1 成功标准 #3（WYSIWYG = preview）在多次使用中持续成立

### 做什么

删除所有预览面板相关的代码和 CSS：

**模板删除（~60行）：**
- `.preview-section` 整个 `<section>`（L423-462）
- `.resize-handle` 拖拽分隔线（L465-471）
- 手机框内的预览切换 segment（L429-441）
- `phone-content` 的 `v-html="previewHtml"` 绑定（L459）
- 移动端预览浮钮 `mobile-preview-fab`（L497-499）

**脚本删除 / 简化（~50行）：**
- `showPreview` ref（L524）
- `previewPosition` ref（L525）
- `previewWidth` ref + 拖拽逻辑 `startResize/onResize/stopResize`（L540-590）
- `previewHtml` ref + `renderHtml()`（L596, L1141-1149）
- settings 持久化中 `previewPosition`/`showPreview` 字段（L631-634, L672-675）
- `watch` 中 preview 相关的 watch（L1604）
- 移动端预览切换逻辑（L1613）

**CSS 删除（~70行）：**
- `.preview-section` 全家桶
- `.phone-frame` / `.phone-topbar` / `.phone-status` / `.phone-content`
- `.resize-handle` 及其伪元素
- `.preview-segment` / `.preview-btn`
- 响应式预览面板覆盖样式

**模板简化：**
- `.main-content` 的 `:class` 绑定去掉 `preview-left` / `preview-hidden`
- 工具栏的预览按钮改为无操作或直接改为别用

### 为什么放在最后

只有前面所有阶段都确认稳定后，预览面板才完成历史使命。在此之前它是你的安全对照工具——不要过早删掉你的对照仪。

### 成功标准

1. `npm run build` 零错误
2. 页面只显示工具栏 + Milkdown 编辑器（在手机框内），无预览面板
3. 桌面端和移动端布局正常、无空白区域、无布局错乱
4. 复制 HTML / 导出功能正常

### 失败处理

手动回滚 App.vue 的预览面板相关改动（改动集中、容易定位）。

---

## 附录 A：回滚操作手册

### 完全回滚（任何阶段）

```bash
# 1. 切回主分支，放弃迁移分支的所有改动
git checkout main

# 2. 验证恢复
npm run build

# 迁移分支保留（不删除），以备复盘或重新尝试
# 如果确定不再需要迁移分支：git branch -D migration/milkdown
```

### 部分回滚（某个 Phase 失败）

```bash
# 方案一：回退到上一个 Phase 的 commit（推荐）
git log --oneline  # 找到上一个 Phase 的 commit hash
git reset --hard <commit-hash>
npm run build

# 方案二：只回退 App.vue（如果改动集中在单文件）
git checkout HEAD~1 -- src/App.vue
npm run build
```

### 不建议的回滚方式

- 不要靠记忆手动改回来（人脑不可靠）
- 不要靠旧 dist 目录恢复源码（dist 是构建产物，不能反向恢复 Vue 源码）
- 不要 `rm -rf` 项目目录再 `cp -r` 备份（已有 Git，不需要这种操作）

---

## 附录 B：依赖变更清单

### 删除

```json
"md-editor-v3": "^4.14.0"
```

### 新增

```json
"@milkdown/kit": "^7.17.0",
"@milkdown/vue": "^7.17.0",
"remark-directive": "^3.0.0"
```

> `remark-directive` 是 `:::` 容器语法往返的核心依赖。`@milkdown/kit` 已内置 listener 插件（`@milkdown/kit/plugin/listener`），无需单独安装。
>
> 版本说明：`@milkdown/vue` 当前最新稳定版为 v7.17.1。使用 `^7.17.0` 确保 7.x 兼容。原计划写 `^7.19.1` 可能尚不存在。

### 保留不变

```json
"vue": "^3.4.30",
"marked": "^18.0.5",
"dompurify": "^3.1.5",
"turndown": "^7.2.4",
"@vitejs/plugin-vue": "^5.0.5",
"vite": "^5.3.3"
```

### 为什么不装 @milkdown/theme-nord

见 Phase 1「为什么自写主题 CSS」。不需要，反而添乱。

---

## 附录 C：每阶段验收清单

### Phase 0 验收

- [ ] `migration/milkdown` 分支已创建，主分支不受影响
- [ ] POC 项目：H1 确认 `:::` 默认不往返（预期失败）
- [ ] POC 项目：H1.5 确认 remark-directive + 自定义 node 可实现往返
- [ ] POC 项目：H2 中文输入不跳光标（或过滤 syncHeadingIdPlugin 后正常）
- [ ] POC 项目：H3 themeToCss 注入后 h1 渲染与 buildHtml 肉眼一致

### Phase 1 验收

- [ ] `npm run build` 零错误零 warning
- [ ] 浏览器：编辑器正常启动，可输入 Markdown
- [ ] 浏览器：WYSIWYG 渲染与预览面板 buildHtml 输出肉眼一致
- [ ] 浏览器：`::: cover` / `::: divider` / `::: quote` 语法 getMarkdown 往返正常（H1.5 结论在生产代码中成立）
- [ ] 浏览器：复制 HTML → 粘贴到微信，格式与 v0.8.2 一致
- [ ] `git commit` 记录 Phase 1 成果

### Phase 2 验收

**装饰节点：**
- [ ] `npm run build` 零错误
- [ ] 编辑器内输入 `::: cover` → 渲染为封面卡片
- [ ] 编辑器内输入 `::: divider` → 渲染为分割线
- [ ] 编辑器内输入 `::: quote` → 渲染为金句卡片
- [ ] 节点渲染效果与预览面板 buildHtml 肉眼一致
- [ ] `getMarkdown()` 输出保留 `::: type` 原始语法

**工具栏：**
- [ ] 封面卡片按钮 → 光标处正确插入封面节点
- [ ] 分割线按钮 → 插入分割线节点
- [ ] 金句卡片按钮 → 插入金句节点
- [ ] 粘贴图片 URL → 插入正确
- [ ] AI 生成 → 编辑器内容更新
- [ ] 导入提纯 → 编辑器内容更新
- [ ] 清除样式 → 正常工作
- [ ] `git commit` 记录 Phase 2 成果

### Phase 3 验收

- [ ] `npm run build` 零错误
- [ ] 页面无预览面板残留
- [ ] 桌面端 / 移动端布局正常
- [ ] 复制 / 导出功能正常
- [ ] 所有之前正常的功能回归正常
- [ ] `git commit` 记录 Phase 3 成果
- [ ] 合并 `migration/milkdown` 分支到主分支，打 tag `v0.9.0`
