# 净排 UX 优化 · 高优先级实施 Spec（v1.0）

> 基线：v0.9.1（Milkdown WYSIWYG 迁移后，src/App.vue ≈ 2963 行）
> 范围：优化清单「🔴 高优先级」6 项（编号 1–6）
> 日期：2026-07-16
> 作者：UI Designer（复核 + 规格）

---

## 0. 范围与约束

- **只动高优先级 6 项**，不动中/低优先级。
- **不动** `buildHtml` 复制/导出管线、**不动** `THEMES` 主题数据、**不动** AI 业务逻辑（仅改 `callAI` 的错误处理与取消机制）。
- 改动集中在 `src/App.vue`；若需新增小工具函数，仍内联，不新建模块（保持单文件现状，待项 27 再拆）。
- **纯前端、不联网**硬约束不变：深色模式、快捷键、撤销重做、断点、AI 取消全部本地执行。

---

## 1. 执行顺序（建议）

| 序 | 项 | 理由 |
|----|----|------|
| 1 | **6 AI 错误反馈 + 取消/超时** | 最独立、用户痛点明确、风险最低 |
| 2 | **4 撤销/重做按钮** | 仅依赖 Milkdown action，独立 |
| 3 | **3 键盘快捷键** | 与项 4 同处工具栏，可一并落地 |
| 4 | **1 装饰块可视化稳定性** | 编辑器初始化处，需谨慎防循环 |
| 5 | **5 平板断点 + 分隔线修复** | 纯 CSS + matchMedia，独立 |
| 6 | **2 深色模式** | 改动最大（全量 token + 新切换器），放最后避免与前述 CSS 改动冲突 |

---

## 2. 逐项规格

### 项 1 · 装饰块可视化稳定性（InitReady race condition）

- **目标**：首屏加载后，`::: cover / quote / divider` 必渲染为 `.milkdown-decor-*` 卡片，杜绝偶发回退成纯文本段落。
- **现状**：
  - 节点定义 `createDirectiveNode`（L1421-1465），`toDOM` 已渲染为卡片。
  - 初始化 `.use(coverDirective/dividerDirective/quoteDirective)`（L1831-1833），在 `.create()`（L1836）前注册。
  - 竞态：`CHANGELOG` 记录首屏初始化未完成时，已存在的 `:::` 可能解析为普通段落，需重新触发才渲染。
- **改动点**：
  1. 在 `.create()` 成功之后（`L1836` 后），于编辑器真正 ready 时做一次首屏重渲染：
     `await nextTick(); milkdownEditor.action(replaceAll(getMarkdown()));`
  2. 防循环：复用既有 `isFromEditor` 保护（L1822-1827 的 `markdownUpdated` 回写机制），首屏重渲染设一次性 `isFirstRender` 标志，仅触发一次。
  3. 更稳方案（二选一，推荐）：改用 Milkdown `status` / `onCreate` 就绪事件驱动，而非盲目 `replaceAll`。
  4. dev 模式加断言：`console.assert(document.querySelector('.milkdown-decor-cover'), '首屏 cover 未渲染为卡片')`。
- **验收**：冷启动 20 次（含首屏即含 `::: cover`），卡片渲染率 100%；无控制台报错；编辑器内容/光标不因重渲染丢失。
- **风险**：`replaceAll` 会重置光标 → 必须只在首屏、内容非空时执行一次。

### 项 2 · 深色模式

- **目标**：编辑器外壳（工具栏/面板/状态栏/预览区）支持浅色/深色/跟随系统三态，不依赖系统强制。
- **现状**：`:root` 仅浅色变量集（L1856-1883），无 `[data-theme="dark"]`，无 `prefers-color-scheme` 适配。
- **改动点**：
  1. 新增 `:root[data-theme="dark"]` 全集（基于现有 token 派生）：
     ```
     --bg-primary:#1c1b22; --bg-secondary:#16151b; --bg-hover:#25242e; --bg-active:#2d2b38;
     --text-primary:#e8e6f0; --text-secondary:#a8a6b8; --text-tertiary:#7e7c8e;
     --border-light:#2c2b36; --border-medium:#38373f;
     --accent-blue:#4cb3d9; --accent-green:#2ecc71;
     --shadow-sm/md/lg: 同结构但 rgba 提亮（如 0.2/0.3/0.4 白）；--radius-* 不变。
     ```
  2. 自动跟随：`@media (prefers-color-scheme: dark) { :root[data-theme="system"] { /* 套用 dark 全集 */ } }`。
  3. `data-theme` 挂到 `<html>` 或应用根节点（目前 `body` 用 var，需确保根节点能承载属性）。
  4. 工具栏新增三态切换按钮：`浅色 / 深色 / 跟随系统`，`aria-pressed` 标当前态。
  5. 持久化：`podcast_settings.themeMode = 'light' | 'dark' | 'system'`（沿用现有 localStorage 读取/写入路径，L620-664 区间）。
  6. **项 18（外壳对比度）留待中优先级**，但本项定义的深色文字色需自带 ≥4.5:1 对比度。
- **验收**：三态切换即时生效、刷新后保持；深色下所有文字/图标对比度达标；`prefers-color-scheme` 系统级切换在「跟随系统」态下响应。
- **风险**：Milkdown 内部编辑区样式可能不跟随外壳变量 → 需同步给 `.milkdown .ProseMirror` 注入深色背景/文字；预览区（手机框）背景也要随态切换。

### 项 3 · 键盘快捷键

- **目标**：高频操作可纯键盘完成。
- **现状**：复制/预览/主题等全靠鼠标（L74-84 等）；Milkdown 内置 Ctrl+B/I，但工具栏功能无快捷键。
- **改动点**：
  1. `onMounted`（L1808）注册 `window.addEventListener('keydown', onKeydown)`；`onUnmounted`（L1848）移除。
  2. `onKeydown` 映射：
     - `Ctrl/Cmd+Shift+C` → `copyHtml()`（L1554）
     - `Ctrl/Cmd+Shift+P` → `showPreview = !showPreview`
     - `Ctrl/Cmd+S` → `preventDefault()` + 立即 `saveSettings()`/落盘
     - `Ctrl/Cmd+/` → 切换「快捷键帮助」浮层
  3. 工具栏 `tooltip` 补快捷键提示文字（如「复制 HTML ⌘⇧C」）。
  4. 「快捷键帮助」浮层：复用现有 floating-panel 样式，列出全部快捷键（轻量，不新建组件）。
- **验收**：上述 4 组快捷键在编辑/面板聚焦时均生效；`Ctrl+S` 不被浏览器「保存网页」拦截；Mac `Cmd` 与 Win `Ctrl` 同效。
- **风险**：与 Milkdown 内置 `Ctrl+B/I/Z/Y` 不冲突（本项不占用这些）；`Ctrl+/` 在部分浏览器有默认行为需 `preventDefault`。

### 项 4 · 撤销/重做按钮

- **目标**：工具栏提供可视化撤销/重做，覆盖非技术用户。
- **现状**：Milkdown（ProseMirror）内部支持 `Ctrl+Z/Y`，但工具栏无按钮（L60-133 工具栏无 undo/redo）。
- **改动点**：
  1. `import { ..., undo, redo } from '@milkdown/kit/utils'`（现有 L503 已导入 `replaceAll, $nodeSchema, $remark`）。
  2. 工具栏「编辑」组（置于「装饰」前，L60 之前）新增两个 `toolbar-item`：
     - 撤销：`@click="milkdownEditor?.action(undo())"`，SVG 左弯箭头
     - 重做：`@click="milkdownEditor?.action(redo())"`，SVG 右弯箭头
     - 均带 `title` / `aria-label` / `tooltip`。
  3. 可选：监听历史栈变化禁用空态按钮（Milkdown 未直接暴露，先保持常亮，无操作时 action 为 no-op）。
- **验收**：点击撤销回退上一步编辑；重做复原；与键盘 `Ctrl+Z/Y` 行为一致；AI 全文替换后也能逐步撤销。
- **风险**：`action(undo())` 需在 editor 实例就绪后调用 → 按钮点击时实例必已存在，安全。

### 项 5 · 平板断点 + 分隔线修复（合并原 5、6）

- **目标**：768–1024px 区间布局可用；分隔线触屏可拖、抓手定位正确。
- **现状**：
  - 仅 `max-width: 768px`（L1811、L2827）与 `min-width: 769px`（L2101）两套；中间断点缺失。
  - `.resize-handle`（L2123-2149）仅绑 mouse 事件；`.resize-handle::before`（L2135）用 `position:absolute` 但父级无 `position:relative`。
- **改动点**：
  1. 新增 `@media (max-width: 1024px)` 中间断点：`.floating-panel` 宽缩至 280px；`.preview-section` 在该区间默认收起或宽度受限（纯 CSS 调整，不强制改 JS 状态）。
  2. `.resize-handle` 加 `position: relative`（修复 `::before` 偏移，原项 6）。
  3. 分隔线拖拽改 **Pointer Events**：`@mousedown/@mousemove/@mouseup` → `@pointerdown/@pointermove/@pointerup`（L467 附近模板 + 对应 script 逻辑），统一鼠标与触屏；触屏 `touch-action: none` 防页面滚动抢手势。
- **验收**：iPad 竖屏（810px）下编辑器宽度 ≥ 可编辑阈值（≥ 480px）；分隔线在触屏可拖；抓手竖条居中于分隔线。
- **风险**：Pointer Events 在个别旧浏览器需注意 `setPointerCapture`；触屏拖拽与页面滚动冲突 → `touch-action: none` 兜底。

### 项 6 · AI 错误反馈 + 取消/超时（补齐，非从零）

- **目标**：AI 失败时给差异化、可自助的恢复指引；支持中途取消与超时保护。
- **现状（已部分实现）**：
  - `callAI`（L1661-1702）已有：Key 缺失（L1662）、BaseURL 缺失（L1666）、`!resp.ok` 提示「接口返回 X，可能是 Key 无效或厂商禁止浏览器跨域」（L1690）、catch 提示「CORS 请换 OpenRouter」（L1697）。
  - **缺失**：① 无超时（fetch 无 `signal`/`timeout`）；② 无取消按钮；③ 状态码未细分（401/403/429/5xx 混为一句）；④ 无加载 spinner 动画（仅文字 L354）。
- **改动点**：
  1. `AbortController`：`const ctrl = new AbortController(); fetch(..., { signal: ctrl.signal })`；将 `ctrl` 存为模块级变量供取消按钮调用。
  2. 超时：`const timer = setTimeout(() => ctrl.abort(), 30000)`；`finally` 中 `clearTimeout(timer)`。
  3. 取消按钮：AI 面板加载时显示「取消」，点击 `ctrl.abort()`；捕获 `AbortError` → toast「已取消」。
  4. 状态码细分（替换 L1690 笼统提示）：
     - 401/403 → 「API Key 无效或无权限，请到设置页检查」
     - 429 → 「请求过于频繁（429），请稍候再试」
     - 5xx → 「服务暂不可用（5xx），请稍后重试」
     - 网络/CORS → 保留现有 OpenRouter 提示
  5. Spinner：新增 `.ai-spinner` CSS 旋转动画，加载态替换/并列于文字（L354 区域）。
  6. **内容安全**：现有 caller（`aiGenerateTitle` 等）均仅在 `result` 真值时 `replaceAll` → 失败不覆盖原文，保持不变即可。
- **验收**：无效 Key → 明确「Key 无效」提示；429 → 限流提示；30s 无响应自动超时；加载中可点取消；失败时编辑器原文完好。
- **风险**：`AbortController` 在极旧环境不支持 → 项目已用 managed node/现代浏览器，可忽略；取消后 `aiLoading` 必须在 `finally` 复位（现有 L1699-1701 已保证）。

---

## 3. 全局验收清单

- [ ] 6 项全部落地，`vite build` 零错误
- [ ] 首屏 `::: cover` 渲染率 100%（项 1）
- [ ] 深色三态切换 + 持久化 + 对比度达标（项 2）
- [ ] `Ctrl+Shift+C/P`、`Ctrl+S`、`Ctrl+/` 生效且不冲突（项 3）
- [ ] 撤销/重做按钮可用且与键盘一致（项 4）
- [ ] iPad 断点可用、分隔线触屏拖拽 + 抓手居中（项 5）
- [ ] AI 失败差异化提示 + 取消 + 30s 超时 + spinner（项 6）
- [ ] 复制/导出管线、THEMES、AI 业务逻辑未被破坏（回归）
- [ ] CHANGELOG 新增对应版本条目（如 v0.10.0）

---

## 4. 改动量估算（App.vue 单文件）

| 项 | 新增 | 修改 | 删除 |
|----|------|------|------|
| 1 装饰稳定性 | ~6 | ~3（L1836 后） | 0 |
| 2 深色模式 | ~40（token + 切换器 + 持久化） | ~10 | 0 |
| 3 快捷键 | ~30 | ~8（tooltip） | 0 |
| 4 撤销/重做 | ~20 | ~2（import） | 0 |
| 5 平板断点 | ~25 | ~10（resize-handle） | 0 |
| 6 AI 反馈 | ~35（abort/timeout/status/spinner） | ~8（L1661-1702） | 0 |
| **合计** | **~196** | **~41** | **0** |

净增约 **237 行**，仍在单文件可控范围。

---

## 5. 向后兼容

- localStorage：`podcast_settings` 新增 `themeMode` 字段；旧版无此字段时默认 `'light'`，不影响其它键。
- 不新增依赖（undo/redo/abort 均来自已装的 `@milkdown/kit` / 浏览器原生）。
- 不改任何对外复制/导出产物结构。
