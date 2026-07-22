# ADR: 图片操作管线修复计划

> 日期：2026-07-18
> 状态：已接受并实施
> 决策者：用户体验架构师

---

## 背景

用户报告三个问题：
1. 插入本地图片后编辑器显示乱码文本，不是图片预览
2. 上下文工具栏的「删除/替换/调宽度」完全无效（摆设）
3. 插入图片后 Ctrl+Z 撤销无效

---

## 诊断

### 根因：ProseMirror `insertText` 不过 Markdown 解析器

Milkdown 的工作模型：
```
Markdown 文本 → replaceAll() → Milkdown 解析器 → ProseMirror 节点树 → 渲染
```

当前 `insertImage` 做的事：
```js
const imageMarkdown = `\n![图片](data:image/png;base64,iVBORw0KGgo...)\n`;
const tr = view.state.tr.insertText(imageMarkdown, from);
view.dispatch(tr);
```

`insertText` 把 `![图片](data:...)` **当作纯文本段落**插入了 ProseMirror。
它**不会**触发 Milkdown 的 Markdown 解析器，所以永远不会变成 `<img>` 节点。
编辑器里显示的就是那串 `![图片](data:image/png;base64,iVBOR...)` 文本 = "乱码"。

### 派生问题：为什么更早的 ProseMirror 直接操作也不行？

之前两次尝试直接创建 ProseMirror `<img>` 节点：
- 第一次 `document.execCommand('delete')`：纯 DOM API，ProseMirror 不理
- 第二次 `tr.deleteSelection() / replaceWith / setNodeMarkup`：虽然改了 ProseMirror 节点树，但 Milkdown 的 `markdownUpdated` 监听器可能**用 `isSettingEditor` 早退跳过了回写**

### 撤销失效的原因

`insertText` 这个单次 transaction 里只有一行文本插入，即便 ProseMirror history 记录了它也等于「撤销回纯文本 `![图片](data...)`」，用户看到的和没撤销一样。

---

## 方案

### 方案 A：破坏式——直接用 `setEditorMarkdown` 操作 Markdown 文本

对 `insertImage`、`deleteCurrentImage`、`replaceCurrentImage`、`updateImageWidth` 全部改用：
```
markdownText.value = 修改后的 Markdown 文本 → setEditorMarkdown(md)
```
也就是 `replaceAll()` 触发 Milkdown 重新解析整篇 Markdown。

**优点**：确定性最强，走的是 Milkdown 的「正道」解析路径

**缺点**：每次操作整篇替换，光标位置丢失；大文章有性能隐患

### 方案 B：渐进式——改用 ProseMirror 事务创建真正的 image 节点

```js
const imageNode = state.schema.nodes.image.create({ src: url, alt: alt });
view.dispatch(state.tr.replaceSelectionWith(imageNode));
```

直接在 ProseMirror 中创建 `<img>` 节点，不经过 Markdown 文本。

**优点**：精确操作，不丢光标；history 正常跟踪，撤销可用

**缺点**：需要验证 Milkdown 的序列化器能否正确处理 base64 data URL

### 方案 C：混合式——只对插入/替换用 `setEditorMarkdown`，对删除/调宽度用 ProseMirror 事务（推荐） ✅

| 操作 | 方法 | 理由 |
|------|------|------|
| insertImage | `setEditorMarkdown` | 位置在末尾，不丢上下文 |
| deleteCurrentImage | ProseMirror `tr.deleteSelection` | 精确删除当前节点，history 可追踪 |
| replaceCurrentImage | `setEditorMarkdown` | 同 insertion 模式 |
| updateImageWidth | ProseMirror `tr.setNodeMarkup` | 原地改属性，不丢选区 |
| 撤销 | 依赖 ProseMirror history 插件 | 已加载 `import { history } from '@milkdown/plugin-history'` |

**关键前提**：需修复 `isSettingEditor` 标志导致 `markdownUpdated` 监听器早退的问题。当 `isSettingEditor = true` 时 Milkdown 不同步 markdownText，需在操作完成后显式 `markdownText.value = getMarkdown()`。

---

## 决策

选择 **方案 C（混合式）**。

### 理由
1. `setEditorMarkdown`（即 `replaceAll`）是唯一能确保「Markdown 文本被解析成图片节点」的方法
2. 对于不需要重新解析的操作（删除/改属性），ProseMirror 事务更精确，且支持 history 撤销
3. 不引入新依赖

---

## 实施计划

### 第一步：修复 `insertImage`（解决乱码）
**文件**：`src/App.vue` L1331-1351
**改动**：删除 `view.dispatch(tr.insertText(...))`，改用 ProseMirror 直接创建 image 节点
```js
const imageNode = state.schema.nodes.image.create({ src: url, alt: alt || '图片' });
const tr = state.tr.replaceSelectionWith(imageNode);
view.dispatch(tr);
```
**验证**：插入本地图片后编辑器内显示正常图片预览

### 第二步：修复上下文工具栏三函数（删除/替换/宽度）
**文件**：`src/App.vue` L1535-1605 附近
**改动**：
- `deleteCurrentImage` → 直接用 `view.dispatch(view.state.tr.deleteSelection())`，删完同步 markdownText
- `updateImageWidth` → `tr.setNodeMarkup(from, null, { ...attrs, width })`
- `replaceCurrentImage` → 走 `replaceImageInMarkdown` + `setEditorMarkdown`（已验证可用）

### 第三步：修复撤销（history 追踪）
**文件**：`src/App.vue`
**改动**：确保所有 ProseMirror 事务操作后不多余调用 `setEditorMarkdown`（replaceAll 会重置 history）。操作完成后用 `markdownText.value = getMarkdown()` 只做数据同步，不重置编辑器。

### 第四步：构建 + 测试
```bash
vite build && vitest run
```

---

## 影响

### 正面
- 图片插入/删除/替换/调宽度全部可用
- Ctrl+Z 撤销可用
- 不破坏现有装饰面板的图片操作（走不同代码路径）

### 兼容性
- 不改变 `buildHtml` / `THEMES` / `callAI`
- 不改变 localStorage schema
- 仅改动 `src/App.vue` 中 ~60 行
