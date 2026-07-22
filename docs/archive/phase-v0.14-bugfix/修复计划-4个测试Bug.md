# 修复计划：测试反馈的 4 个 Bug

> 日期：2026-07-20
> 测试反馈：调宽度/删除、分割线残留、微信 6 个点、编辑器预览宽度不一致

---

## Bug #1：调宽度/删除显示「检测不到该图片」

### 现象
上下文工具栏点击「替换」/「删除」时，弹「找不到该图片，请重新选中后重试」。

### 根因
`deleteEditingImage` / `replaceEditingImage` 用 `editingImage.value.src`（来自 DOM `img.src`）调用 `matchImageBySrc` 查 markdown 文本。base64 data URL 在：
- 浏览器规范化（去掉尾部 padding、改变大小写）
- Milkdown 序列化时可能编码差异

导致 `editingImage.value.src` 与 `markdownText` 中的 src 不完全相同，`matchImageBySrc` 匹配失败。

### 修复方案
从 ProseMirror 节点直接读 src（保证与 markdown 一致），而不是从 DOM：

```js
// 改：const src = editingImage.value.src;
// 新：
const src = getSelectedImageSrcFromProseMirror() || editingImage.value.src;
```

其中 `getSelectedImageSrcFromProseMirror()` 通过 `editorViewCtx` 找到当前选中的 image 节点 attrs.src。

### 验证
- 调宽度 → 正常生效
- 替换图片 → 正常替换
- 删除图片 → 正常删除
- 弹「检测不到」错误不再出现

---

## Bug #2：删除图片后留下 `---` 分割线残留

### 现象
撤销图片插入后，编辑器内出现 `---` 文字（应该被理解为"分割线"装饰块或"水平线"），无法用 Enter 调整、无法删除。

### 根因推测
1. **图片 + 装饰块关联**：`insertImage` 流程可能间接触发了 `::: divider` 装饰块插入（例如 `insertLocalImage` 内部还调用了其他装饰逻辑）
2. **ProseMirror history 只追踪 image 节点的事务**，撤销后装饰块的事务没被一并回滚
3. **图片节点可能与 `::: divider` 装饰块被存放在同一事务中**（如果通过 markdown 文本 `insertText("![...](...)\n:::divider\n:::")` 一次性插入），撤销可能只撤销 image 部分

### 修复方案
先调试：在撤销后查 `markdownText` 实际内容：
- 如果是 `::: divider` 装饰块 → 调查为何它会与图片关联插入，是否可分离
- 如果是水平线 `---` → 调查是否由 `insertLocalImage` 路径产生的副作用

**临时方案**：在撤销后 `markdownText` 中检测到 `---` 残行时，自动清理（但要小心避免误删用户手打的分割线）。

**根本方案**：
- 把 `insertImage` 与装饰块插入分离为两个独立 ProseMirror 事务
- 或：在 `insertImage` 完成后清理掉任何意外的 `---` 行

### 验证
- 插入图片后撤销 → 无 `---` 残留
- 用户手打的 `---`（作为内容一部分）不受影响

---

## Bug #3：复制到微信公众号后台出现「...」（六个点）

### 现象
复制 HTML 粘贴到微信编辑器后，原本是图片的位置变成 `...`（占位符）。

### 根因
微信对粘贴内容做两道处理：
1. **base64 data URL 过滤**：微信端不接受超长 base64 图片数据，认为是"无效图片"并替换为 `...` 占位符
2. **`<img>` 标签 `src` 白名单**：微信端只接受 HTTP(S) URL，不接受 `data:` 协议

所以**base64 内联图片无法直接在微信公众号显示**——用户必须在微信素材库上传后才能用。这是已知的功能性限制，不是代码 Bug。

### 修复方案（不是改代码，是改提示）
提升「复制时」的提示文案：

```js
showToast(
  'HTML 已复制到剪贴板。⚠️ 图片是 base64 内联数据，微信会自动替换为「…」占位符——' +
  '请到微信素材库上传原图后，在公众号编辑器里替换图片。',
  'warning',  // 新增 warning 级别
  8000  // 长显示时间
);
```

现有 toast 在 `copy` 函数里。检查 `src/App.vue` 里的 copy/export 相关 toast，找合适位置替换文案。

### 验证
- 复制 HTML → 微信后台粘贴 → 看到清晰的「图片需在素材库上传」提示，而不是无声的「...」

---

## Bug #4：编辑器与预览界面图片宽度不一致

### 现象
上下文工具栏调宽度到 50%：
- 预览区图片显示 50% 宽度 ✅
- 编辑器内图片仍然 100% 宽度 ❌

### 根因
`updateImageWidth` 只更新 `imageWidthMap[src] = w` + `convertMarkdown()` 刷新预览 HTML。
**编辑器里的 Milkdown 渲染出的 `<img>` 没有 width 属性**——width 信息存在外部 map 里，ProseMirror 节点不知道。

### 修复方案
`updateImageWidth` 同步更新 ProseMirror 节点的 `width` 属性：

```js
const updateImageWidth = () => {
  if (!editingImage.value || selectedType.value !== 'image' || !milkdownEditor) return;
  // 1. ProseMirror 节点上更新 width 属性
  milkdownEditor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    if (!view) return;
    const { state } = view;
    const selNode = state.selection.node;
    if (selNode?.type.name === 'image') {
      // setNodeMarkup 不会触发 markdownUpdated 序列化丢失（width 是节点 attr）
      // 但要让 history 记录这个事务
      const tr = state.tr.setNodeMarkup(state.selection.from, null, {
        ...selNode.attrs, width: imageWidth.value + '%'
      });
      view.dispatch(tr);
    }
  });
  // 2. imageWidthMap 同步（buildHtml 渲染预览时用）
  imageWidthMap.value[editingImage.value.src] = imageWidth.value;
  saveImageWidthMap();
  // 3. 不要调 convertMarkdown — 预览由 markdownText → renderHtml 自动触发
};
```

**注意**：proseMirror 的 image 节点没有 `width` attr —— 需要先看 schema 定义。如果没有，可能要扩展 schema。

### 验证
- 调宽度 → 编辑器图片缩放 ✅
- 调宽度 → 预览区图片缩放 ✅
- 两个区域宽度一致 ✅

---

## 修复顺序

```
#1 (检测不到图片) → 改 src 来源（ProseMirror 而非 DOM），1 处函数改
#2 (分割线残留)    → 调试 + 调查副作用，可能需重构 insertImage
#3 (微信6个点)      → 改 toast 文案，1 处函数改
#4 (宽度不一致)    → updateImageWidth 加 ProseMirror 节点更新
```

## 优先级

- **P0** #1（核心图片操作可用性）
- **P0** #4（用户体验一致）
- **P1** #3（用户教育/防止误操作）
- **P2** #2（视觉残留，频率较低）

每修一项都要：
- `vite build` 通过
- `vitest run` 通过
- 实物测试场景

## 当前不修（已知设计限制）

- 删除图片后 Ctrl+Z 撤销不工作 → `setEditorMarkdown` → `replaceAll` 销毁 history 栈
- 微信 base64 替换为占位符 → 微信端限制，需用户手动上传
