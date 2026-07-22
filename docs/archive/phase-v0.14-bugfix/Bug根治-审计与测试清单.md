# Bug 根治审计报告 + 测试清单

> 日期：2026-07-20
> 基线：App.vue 3704 行，构建/测试全过，新增 `imageWidthMap` 方案

---

## 诊断结论

### 已修复（代码审计确认）

| 功能 | 修复方式 | 代码行 |
|------|---------|--------|
| `updateImageWidth` | 改用 `imageWidthMap[src] = w`，不碰 ProseMirror，不碰 Markdown 文本 | L1389-1398 |
| `replaceImageInMarkdown` | **始终输出 `![alt](src)`**，HTML `<img>` 转换分支已删除。宽度存 `imageWidthMap` | L1271-1311 |
| `buildHtml` | 接收 `imageWidthMap`，渲染时注入 `width` 属性到 `<img>` | `buildHtml.js` L176-183 |
| `insertImage` | `nextTick` + `isSettingEditor` 闸门保护 history 栈 | L1142-1157 |

**关键架构变化**：宽度信息从 Markdown 文本中**完全分离**。编辑器里图片永远是干净 `![alt](url)`，宽度存储在 `imageWidthMap`（localStorage 持久化），预览/导出时由 `buildHtml` 后处理注入。

### 待测试验证（不确定是否仍有 Bug）

| # | 场景 | 风险 | 原因 |
|---|------|------|------|
| T-1 | 上下文工具栏调宽度 → 图片正常显示 | 🟡 中 | `updateImageWidth` 已改，但需实物验证预览和编辑器都正常 |
| T-2 | 图片编辑面板调宽度 → 点「应用」→ 正常 | 🟡 中 | `commitImageEdit`→`replaceImageInMarkdown`→`setEditorMarkdown` — `replaceAll` 后 Markdown 纯文本是否被正确重新解析 |
| T-3 | 插入图片后 Ctrl+Z → 图片消失 | 🔴 高 | `markdownUpdated` 监听器 + `isFromEditor`/`isSettingEditor` 双闸门 + `flush:'sync'` watcher 的时序竞态 |
| T-4 | 上下文工具栏删除图片后 Ctrl+Z → 恢复 | 🟢 低 | `deleteEditingImage`→`setEditorMarkdown`，但 `setEditorMarkdown` 内 `replaceAll` 会销毁整个编辑器内容 → history 必然丢失 |
| T-5 | 先调宽度再插入第二张图 → 两张图宽度独立 | 🟢 低 | `imageWidthMap` 以 src 为 key，两张图 src 不同 → 应天然隔离 |
| T-6 | 刷新页面后图片宽度保持 | 🟢 低 | `imageWidthMap` 存 localStorage |

### 可能仍存在的 Bug

1. **T-4**：通过 `deleteEditingImage` → `setEditorMarkdown` 删除图片后，编辑器内容被 `replaceAll` 全部替换，ProseMirror history 栈必然被清空——此时 Ctrl+Z 必定无法恢复被删的图片。这是一个**设计决定而非 Bug**——如果接受「替换图片/删除图片后不能撤销」，则不需要修。

2. **T-3**：`insertImage` 的 `nextTick` + `isSettingEditor` 闸门理论上保护了 history 栈，但 `markdownUpdated` 监听器如果触发时机在 `nextTick` 之后（`isSettingEditor` 已复位为 false），sync watcher 仍可能执行 `replaceAll` 覆盖 history。需要实物测试确认。

3. **T-7（新增）**：`updateImageWidth` 更新 `imageWidthMap` 后调用 `convertMarkdown()` 只刷新了**预览**的 HTML。编辑器中 Milkdown 渲染的 `<img>` 元素**宽度不会变**——因为 ProseMirror 节点没有被更新。用户可能在编辑器里看到的图片宽度和预览不一致。这是一个 **UX 不一致**问题。

---

## 测试清单

请按以下步骤逐项验证。每项打 ✅ 或 🔴，🔴 的项记录具体现象。

### 准备工作
- [ ] 打开浏览器，清除 localStorage（F12 → Application → Local Storage → Clear）
- [ ] 用示例文章初始化（或手动粘贴一段内容）

### 第一组：上下文工具栏图片操作

| # | 步骤 | 预期 | 结果 |
|---|------|------|------|
| 1 | 插入一张本地图片（< 1MB） | 编辑器显示图片预览，无乱码 | ⬜ |
| 2 | 点击图片 → 上下文工具栏出现「图片」标签 | 工具栏显示宽度拖杆、替换、删除 | ⬜ |
| 3 | 拖动宽度到 50% → 看**编辑器**中的图片 | 图片应在编辑器内缩放（或至少预览中缩放） | ⬜ |
| 4 | 拖动宽度到 50% → 看**预览区**中的图片 | 预览区图片宽度应该变化 | ⬜ |
| 5 | 点击「删除」 | 编辑器中图片消失，预览也消失 | ⬜ |
| 6 | Ctrl+Z | 如果能恢复被删图片则记录，不能也记录 | ⬜ |

### 第二组：图片编辑面板（装饰面板中的）

| # | 步骤 | 预期 | 结果 |
|---|------|------|------|
| 7 | 再插入一张图片（用拖拽） | 显示正常 | ⬜ |
| 8 | 点击图片 → 左侧弹出「图片编辑」面板 | 面板显示缩略图、alt、宽度、应用 | ⬜ |
| 9 | 拖动宽度到 70%，点「应用」 | 图片编辑面板关闭，编辑器图片正常，预览宽度跟随 | ⬜ |
| 10 | Ctrl+Z | 记录能否撤销宽度变化 | ⬜ |

### 第三组：撤销

| # | 步骤 | 预期 | 结果 |
|---|------|------|------|
| 11 | 在编辑器里输入一行文字「测试」 | 正常显示 | ⬜ |
| 12 | Ctrl+Z | 「测试」消失 | ⬜ |
| 13 | 插入一张图片 | 显示正常 | ⬜ |
| 14 | Ctrl+Z | 记录图片是否消失 | ⬜ |
| 15 | 再插一张图 → 删除 → Ctrl+Z | 记录能否恢复 | ⬜ |

### 第四组：编辑器与预览一致性（T-7）

| # | 步骤 | 预期 | 结果 |
|---|------|------|------|
| 16 | 插入图片，宽度调到 40% | 记录编辑器中的图片宽度是否改变 | ⬜ |
| 17 | 看预览区相同图片 | 记录预览宽度是否 40% | ⬜ |
| 18 | 如果编辑器宽度和预览不一致，切换装饰面板再切换回来 | 记录编辑器宽度是否有变化 | ⬜ |

### 附加

| # | 步骤 | 预期 | 结果 |
|---|------|------|------|
| 19 | 刷新页面（不清理 localStorage） | 图片宽度恢复（预览中 50%/70%/40%） | ⬜ |
| 20 | 复制 HTML → 粘贴到微信后台 | 图片宽度在微信中生效 | ⬜ |

---

## 修复计划

根据测试结果，按优先级：

### P0（测试后确认的实时 Bug）
- 如果 T-3 失败 → 修复 `insertImage` 的 history 保护（可能需要改用 `view.dispatch(tr)` 后不等 `nextTick`，直接在同步代码中 `isSettingEditor=true; markdownText=getMarkdown(); isSettingEditor=false`）
- 如果 T-2 失败 → `commitImageEdit` 的 `setEditorMarkdown` 改用增量操作而非 `replaceAll`

### P1（UX 不一致）
- 如果 T-7 确认编辑器宽度 ≠ 预览宽度 → 在 `updateImageWidth` 中同时更新 ProseMirror 图片节点（仅改 DOM 属性不触发 Markdown 回写），或者接受「编辑器宽度不变、只在预览看到」的现状并加说明

### P2（已知设计限制）
- T-4/T-6 的不可撤销——这是 `replaceAll` 方案的内在限制，除非重构图片操作为 ProseMirror 原生事务，否则不修
