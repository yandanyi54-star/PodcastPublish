# 净排 v0.14.0 修复计划

> 配套审查报告：`CODE_REVIEW_v0.14.0.md`
> 范围：3 个 🟡 功能缺陷（用户侧静默失效）+ 可选打磨项
> 优先级：**#3 选中替换假成功 > #2 跟随系统外壳恒暗 > #1 字间距滑杆失效**

---

## 总览

| # | 缺陷 | 严重度 | 改动文件 | 改动量 |
|---|------|--------|----------|--------|
| 3 | AI 选中替换频繁失败 + 假成功 toast | 🟡 | `src/App.vue` | 中（替换逻辑 + 调用方） |
| 2 | 「跟随系统」外壳恒为深色、明暗割裂 | 🟡 | `src/App.vue`(CSS)、`src/styles/variables.css` | 中（解耦 system/dark） |
| 1 | 编辑器内「字间距」滑杆无效（0.5pxpx） | 🟡 | `src/App.vue` | 极小（1 行）+ 测试 |

预计新增/修改 3 个测试，跑通 `vitest`（当前 52 绿）与 `vite build`。

---

## 缺陷 #3（最高优先）：AI 选中替换失败 + 假成功

### 现象
上下文栏「扩写 / 改写 / 翻译」选中文本后，内容经常**不变**，却弹出「已扩写选中内容」成功提示——用户误以为成功。

### 根因（`src/App.vue`）
- `getSelectedMarkdown()`（1068–1083）通过 Milkdown serializer 把选区序列化成 Markdown。
- `replaceSelectedWith()`（1086–1095）用 `markdownText.value.indexOf(sel)` 在**全篇序列化文本**里定位选区：
  ```js
  const md = markdownText.value;
  const idx = md.indexOf(sel);
  if (idx === -1) return false;   // ← 选区序列化结果与全篇序列化常常不一致，频繁 -1
  ```
  选区的序列化结果和整篇的序列化结果在换行/空白上往往不一致，`indexOf` 返回 `-1` → 直接 `return false`，**整篇不被替换**。
- 调用方 `aiExpand / aiRewrite / aiTranslate`（1370–1371 / 1387–1388 / 1404–1405）**忽略返回值**，无条件 `showToast('已扩写'+label, 'success')` → 假成功。

### 修复方案（推荐 Option 1）
**Option 1 — 文档级区间替换（健壮，推荐）**
- 让 `getSelectedMarkdown()` 同时返回选区位置 `{ text, from, to }`（点击时通过 `editorViewCtx` 取 `view.state.selection`）。
- `replaceSelectedWith(res)` 改用 ProseMirror 事务，把 `from..to` 区间替换为把 `res` 解析回的节点：
  ```js
  milkdownEditor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const nodes = ctx.get(parserCtx)($markdown(res));   // 解析 Markdown → 节点
    const tr = view.state.tr.replaceWith(from, to, nodes);
    view.dispatch(tr);
  });
  ```
  不再做任何字符串 `indexOf` 手术，从根本上消除序列化不一致。
- 调用方必须检查返回值：`if (!replaceSelectedWith(res)) { showToast('替换失败，请重试', 'error'); return; }`，消除假成功。

**Option 2 — 字符串兜底（改动小、风险低，但未根治序列化问题）**
- 保留 `indexOf`，但失败时尝试归一化变体（`sel.trim()`、补/去尾部 `\n`、折叠多余空白）。
- 始终在失败分支弹错误 toast。
- 仅作为 Option 1 不可行时的安全降级。

> 实施时以 Option 1 为准；Option 2 的「失败必弹 toast」是**无论选哪种都必做**的最小正确改动。

### 影响面
- `aiExpand` / `aiRewrite` / `aiTranslate` 三个选中分支；全文分支（`sel` 为空）不受影响。
- 测试建议：
  - `replaceSelectedWith` 在「多段选区」（含标题+段落）时能成功替换、且调用方不弹假成功。
  - `replaceSelectedWith` 在定位失败时返回 `false`、调用方弹错误 toast。

---

## 缺陷 #2：「跟随系统」外壳恒为深色、明暗割裂

### 现象
选「跟随系统」：OS=深色时碰巧一致；**OS=浅色时外壳是深色、编辑区却是白底**——既没真正跟随系统，还出现外壳/编辑区明暗分裂。

### 根因
- `src/styles/variables.css:38–39` 把 `:root[data-theme="system"]` 与 `dark` **共用同一套深色变量**：
  ```css
  :root[data-theme="dark"],
  :root[data-theme="system"] { /* 全部深色变量 */ }
  ```
  `:root[data-theme="system"]` 因此**永远**拿到深色，与 OS 无关。
- 仅 65–70 行的 `@media (prefers-color-scheme: dark)` 对 system 做阴影微调——OS=浅色时这段根本不生效，外壳仍是深色。
- **重要前提**：JS 端编辑器暗色派生已经正确。`isDarkMode` 计算属性（541–543）解析 `'system' → systemDark.value`，`editorThemeCss`（844）据此 `deriveDarkTheme`，所以**编辑区**会正确跟随 OS。问题纯粹在外壳 CSS。
- 但 `src/App.vue` 内还有 8 处组件样式用 `:root[data-theme="dark"], :root[data-theme="system"]` 选择器（2029–2136，含手机预览框等），同样把 system 写死成深色。

### 修复方案（推荐：JS 端解析 effective data-theme）
把「system → light/dark」的解析**统一收口到 JS**（已有 `systemDark` ref 与监听），`data-theme` 属性只写**已解析**的结果，CSS 不再感知 `system`：

1. 新增 `resolveMode(mode)`：`mode === 'system' ? (systemDark.value ? 'dark' : 'light') : mode`。
2. `_initialTheme`（526）与 `applyThemeMode`（531–535）改设 `document.documentElement.setAttribute('data-theme', resolveMode(mode))`，消除首帧闪烁与写死。
3. `systemDark` 的 `matchMedia` 监听（1622 附近）：当 `themeMode==='system'` 时重新 `setAttribute` resolved 值，使外壳随 OS 实时切换。
4. `src/styles/variables.css`：
   - 38–39 改为仅 `:root[data-theme="dark"]`（去掉 `, :root[data-theme="system"]`）。
   - 删除 64–71 的 system 阴影 media 块（已无意义）。
5. `src/App.vue` 内 8 处 `:root[data-theme="dark"], :root[data-theme="system"]` 选择器：去掉 `:root[data-theme="system"]` 部分（`[data-theme="system"]` 不再被写到 DOM，这些规则永远不该匹配 system）。

> 备选方案 A（纯 CSS）：在 variables.css 用 `@media (prefers-color-scheme: dark){ :root[data-theme="system"]{深色变量} }` 给 system 单独一份深色，并同步把 App.vue 8 处选择器移入对应 media 块。改动更碎、易漏，不推荐。

### 验证点
- OS=浅色 + 模式=system → 外壳浅色、编辑区浅色（一致）。
- OS=深色 + 模式=system → 外壳深色、编辑区深色（一致）。
- 运行时切换 OS 深浅 → 外壳实时跟随（无需刷新）。
- `data-theme` 属性值在 system 模式下应为 `light`/`dark` 而非字面 `system`（可在 DevTools 核对）。
- 测试建议：新增单元/集成测试断言「system 模式 + OS 浅色时，shell CSS 变量 `--bg-primary` 解析为浅色值」。

---

## 缺陷 #1：编辑器内「字间距」滑杆无效

### 现象
在外观面板拖「字间距」滑杆，编辑器内文字间距**不变**（预览/导出正常）。

### 根因（一行之过）
- `src/composables/useStyle.js:64` 存值时已带单位：`newStyle['letter-spacing'] = tempLetterSpacing.value + 'px';` → 存为 `"0.5px"`。
- `src/App.vue:884` 又追加了一次 `px`：
  ```js
  parts.push(`letter-spacing:${ov['letter-spacing']}px`);  // → letter-spacing:0.5pxpx（非法，整条被浏览器丢弃）
  ```
- `src/buildHtml.js:168` 写法正确（直接用存储值、不补 px）→ 预览/导出正常。这正是「只有编辑器失效」的原因。

### 修复方案（极小）
`src/App.vue:884` 改为与 buildHtml 一致，去掉多余 `px`：
```js
if (ov['letter-spacing']) parts.push(`letter-spacing:${ov['letter-spacing']}`);
```
与同函数 881 行 `font-size` 的处理方式（存值时已带 px、此处不再补）完全对齐。`useStyle.js` 不动，保持存储一致。

### 测试建议
- 断言 `editorThemeCss` 含 `letter-spacing:0.5px` 且**不含** `0.5pxpx`。
- 断言 `buildHtml`（已有覆盖路径）输出的 `letter-spacing` 合法。

---

## 打磨项（💭 nits，可选，低优先，不阻塞发版）
1. `src/callAI.js` 的 `timedOut` 字段恒为 `false`（返回的是调用时的副本，定时器改的是局部变量）——误导性。当前未使用，建议要么返回响应对象引用、要么删除该字段。
2. Onboarding 步骤 2 文案仍写「点击左侧『样式』」，工具栏已改名「外观」——改文案。
3. 预览面板 resize 拖拽在 `document` 上挂的 `mousemove/mouseup` 监听器，`onUnmounted` 未清理——补清理，避免泄漏。
4. 品牌字体无单独「清除」入口——与品牌色清除对齐，补一个清除按钮。
5. `ThemeModeSwitch` 用 `role="radio"` 但外层非 `radiogroup`，缺键盘方向键支持——包一层 `role="radiogroup"` 或改用标准方案。
6. `stripBareDirectives` 会误删「内容恰好是『点击编辑文字』」的装饰块——已知极小概率边界，可加更精确的占位判定。

---

## 执行顺序与交付

### 建议顺序
1. **#1 字间距**（1 行 + 测试）— 最快见效，顺手验证测试基线。
2. **#3 选中替换**（核心功能，用户感知最痛）— 文档级替换 + 去掉假成功 toast + 测试。
3. **#2 跟随系统**（解耦 system/dark）— JS 解析收口 + 清理 CSS system 选择器 + 测试。

### 完成后验证
- `C:\Users\yan\.workbuddy\binaries\node\versions\22.22.2\node.exe node_modules/vitest/vitest.mjs run` 全绿（≥55）。
- `vite build` 通过。
- 手动/浏览器核对清单：
  - 拖字间距滑杆 → 编辑器实时变。
  - 选中一段 → 扩写/改写/翻译成功替换；故意制造难匹配选区 → 弹错误而非假成功。
  - 模式切到「跟随系统」，分别用系统浅色/深色验证外壳与编辑区一致、且实时跟随。

> 确认计划后我就按 #1 → #3 → #2 顺序动手。需要我连 💭 打磨项一起做，还是只修 3 个 🟡？
