# 净排 v0.14.0 代码审查报告

> 审查范围：v0.14.0 工作区改动（App.vue 重构 + 新组件 AppearancePanel/PublishWizard/ThemeModeSwitch/PreviewPanel/AIPanel + composables + darkTheme/buildHtml/主题/CSS 变量）
> 基线：`vitest` 全部 **52 测试通过**；无崩溃/数据丢失类阻断性 bug，但发现若干真实正确性缺陷。

## 一、总体印象

代码整体质量较高：装饰「幽灵块」的根因（裸 `:::` misparse）在多个解析入口（defaultValueCtx / 首屏 replaceAll / sync watch / setEditorMarkdown）都被 `stripBareDirectives` 防御；`isSettingEditor`/`isFromEditor` 双闸门正确避免了「编辑器↔markdownText」同步回路的死循环；`renderHtml` 统一走 DOMPurify 净化，XSS 防护到位；组件拆分（外观/发布向导/三态控件）清晰。

但存在 3 个**会让某个功能在用户侧静默失效**的正确性 bug，建议修复后再发版。

## 二、应修复（🟡 Suggestion）

### 1. 编辑器内「字间距」微调失效（双重 `px` 单位）
- **位置**：`src/App.vue:884`
  ```js
  parts.push('letter-spacing:' + ov['letter-spacing'] + 'px');
  ```
- **根因**：`src/composables/useStyle.js:64` 存储覆盖值时已经带单位
  ```js
  newStyle['letter-spacing'] = tempLetterSpacing.value + 'px';  // 存成 "0.5px"
  ```
  于是编辑器侧拼出 `letter-spacing:0.5pxpx` —— **非法 CSS，浏览器整条声明丢弃**，滑杆拖动无视觉效果。
  对比 `src/buildHtml.js:168` 写成 `letter-spacing:' + ov['letter-spacing']`（不补 px），所以**预览/导出是正常的，只有编辑器自身错位**。
- **修复**：`App.vue:884` 改为 `parts.push('letter-spacing:' + ov['letter-spacing']);`（与 buildHtml 对齐）。这是唯一一处与 useStyle 存储约定不一致的地方（font-size / line-height 两边都已一致）。

### 2. 「跟随系统」模式外壳恒为深色，且与编辑区明暗不一致
- **位置**：`src/styles/variables.css:39`
  ```css
  :root[data-theme="dark"],
  :root[data-theme="system"] { /* 一律深色变量 */ }
  ```
  仅 `variables.css:65` 的 `@media (prefers-color-scheme: dark)` 对 `system` 微调了阴影。
- **现象**：当 `themeMode === 'system'` 时 `data-theme="system"`，但 CSS 对 system **无条件套用深色变量**；而 `App.vue:541` 的 `isDarkMode` 对 system 取 `systemDark`（= OS 实际偏好）。
  - OS=深色：外壳深、编辑区深 → 一致（碰巧正确）
  - OS=浅色：外壳深、**编辑区浅（白底）** → 不仅「不跟随系统」，还出现外壳/编辑区明暗割裂。
- **修复**：把 `system` 设为默认浅色变量，仅当 `@media (prefers-color-scheme: dark)` 时才覆盖为深色：
  ```css
  :root[data-theme="system"] { /* 浅色变量（与 :root 同）*/ }
  @media (prefers-color-scheme: dark) {
    :root[data-theme="system"] { /* 深色变量 */ }
  }
  ```
  这样外壳与编辑区（`isDarkMode`）才会同步跟随系统。

### 3. AI「选中替换」（扩写/改写/翻译选中文本）常静默失败
- **位置**：`src/App.vue:1086-1095` `replaceSelectedWith`
  ```js
  const sel = getSelectedMarkdown();
  const idx = md.indexOf(sel);   // 用字符串查找定位
  if (idx === -1) return false;
  ```
- **根因**：`getSelectedMarkdown()`（`App.vue:1068`）用 **序列化器** 把选区片段重新序列化成 Markdown，而 `markdownText.value` 是**整篇文档**的序列化结果。两者对多段/含标题/列表/边界的选区序列化结果不一致，`indexOf` 经常返回 `-1` → 函数 `return false`，上层 `aiExpand/aiRewrite/aiTranslate`（`src/App.vue:1370/1387/1404`）**既不替换也无 toast 提示**，用户点了没反应。
  另外即便命中，`indexOf` 取**第一个**出现位置，可能替换到文档中更早的相同文字，而非实际选区。
- **影响**：这是 v0.14.0 主推的「上下文栏 AI 操作」核心路径，失败率高且无反馈，体验很差。
- **建议（正确修法）**：不依赖字符串查找，直接用 ProseMirror 选区定位。在 `replaceSelectedWith` 内取 `view.state.selection.from/to`，对选区内 doc 切片跑 AI，再用 `tr.replaceWith(from, to, 解析结果节点)` 写回；或在 `getSelectedMarkdown` 时一并记录 `from/to` 偏移用于回写。至少需要：失败时给出 `showToast('选中内容替换失败，请重试', 'error')` 反馈，避免「点了没反应」。

## 三、建议项 / 打磨（💭 Nit）

1. **`callAI` 的 `timedOut` 恒为 false**（`src/callAI.js:30,82-86`）：对象字面量在调用时捕获了局部 `timedOut` 的初始值 `false`，定时器里改的是局部变量、不会写回返回对象。当前 `App.vue` 只取 `op.promise` 未用 `timedOut`，暂无实际影响，但该字段具有误导性，建议返回 `() => timedOut` 或把 `timedOut` 提升为闭包内可被读取的引用。

2. **Onboarding 文案与改名不一致**（`src/App.vue:35`）：步骤 2 仍写「点击左侧『样式』选主题」，但工具栏该入口已改名为「外观」（B5）。建议改为「外观」。

3. **resize 拖拽监听器泄漏**（`src/App.vue:558-585`）：`startResize` 给 `document` 挂 `pointermove/pointerup`，但 `onUnmounted` 未移除。用户拖到一半卸载组件会泄漏；建议 `onUnmounted` 里 `stopResize()`。

4. **品牌字体无单独清除入口**（`src/App.vue` `clearBrandColor` / `AppearancePanel.vue`）：「清除」按钮只清品牌色，不清字体；字体下拉无清空。属小遗漏。

5. **`ThemeModeSwitch` 可访问性**（`src/components/ThemeModeSwitch.vue`）：按钮用 `role="radio"`/`aria-checked`，但外层不是 `role="radiogroup"` 且无方向键支持，屏幕阅读器/键盘用户无法用方向键切换。建议外套 `role="radiogroup"` 并加方向键处理（或退化为 `role="group"` + 普通按钮语义）。

6. **`stripBareDirectives` 边界**（`src/buildHtml.js:25`）：种子块中和正则会误删「内容恰好是『点击编辑文字』的 cover/divider/quote」。属已知极小概率边界，已在注释留痕，可不处理。

## 四、测试建议

- 现有 52 测试覆盖了 Enter/序列化/装饰回归，但**未覆盖上述 3 个功能路径**：
  - 编辑器 `editorThemeCss` 在 `customOverrides` 含 `letter-spacing` 时是否产出合法 CSS（断言不含 `pxpx`）；
  - `themeMode='system'` + 模拟 `prefers-color-scheme: light` 时外壳/编辑区明暗一致；
  - `replaceSelectedWith` 在多段/含标题选区下能正确替换。
- 建议补这 3 个用例，防止回归。

## 五、结论

v0.14.0 架构拆分与响应式落地扎实，无阻断性 bug。建议优先修复 **#1 字间距失效**、**#2 系统模式明暗割裂**、**#3 AI 选中替换静默失败** 三项（均为用户侧可见功能失效），再补对应测试。
