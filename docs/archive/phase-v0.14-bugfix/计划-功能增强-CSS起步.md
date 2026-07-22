# 执行计划：功能增强 + CSS 起步

> 日期：2026-07-19
> 来源：Review 跟进建议 · 第三条 + 第二条起步
> 基线：App.vue 3717 行，构建/测试全过

---

## 任务一：dist-bak 废目录清理（5 分钟）

### 现状

`dist-bak-20260715/` 目录遗留，Git 已标记为删除（D 状态）。净排只用 `dist/` 输出。

### 改动

```bash
git rm -r dist-bak-20260715/
```

### 验证

- `git status` 干净
- `vite build` 不变

---

## 任务二：图片上传大小提示（15 分钟）

### 现状

`MAX_IMAGE_SIZE = 10MB`，但手机照片 base64 后极度膨胀（5MB 照片 → 6.7MB base64 字符串 → Markdown 文本卡顿）。用户不知道这个问题。

### 改动

在 `insertLocalImage()` 中，文件 > 2MB 时先弹 `confirm` 而非直接拒绝：

```
"图片较大（>2MB），转为 base64 后 Markdown 文本将显著膨胀，
建议先压缩到 2MB 以内再上传。是否继续？"
→ 确认：继续上传
→ 取消：不上传
```

`confirm` 而非 `alert`——用户有选择权。

### 涉及

- `src/App.vue` `insertLocalImage()` 函数

### 验证

- 拖入 5MB 图片 → 弹窗提示 → 确认后正常上传
- 拖入 500KB 图片 → 直接上传无提示

---

## 任务三：导出面板加 Markdown 导出按钮（20 分钟）

### 现状

导出面板有两个按钮：⬇️ 下载 HTML 文件、🔗 一键打开微信后台。`exportMarkdown()` 函数已存在但未暴露为按钮。

### 改动

1. `ExportPanel.vue` props 加一个 `showMarkdownExport: Boolean`
2. 模板中在「一键打开微信后台」上方插入：

```html
<button class="notion-btn-small" @click="$emit('exportMarkdown')">
  📝 下载 Markdown 文件
</button>
```

3. App.vue 调用处传入 `:show-markdown-export="true"`

### 涉及

- `src/components/ExportPanel.vue`（模板 + props）
- `src/App.vue`（调用处加 prop）

### 验证

- 导出面板打开 → 三个按钮可见
- 点击「下载 Markdown」→ 浏览器下载 `.md` 文件
- `vite build` + `vitest run` 通过

---

## 任务四：CSS 变量独立（10 分钟）

### 现状

`:root` 和 `[data-theme="dark"]` 的 CSS 变量（约 50 行）夹在 App.vue `<style>` 最前面。

### 改动

1. 新建 `src/styles/variables.css`，复制 `:root` / `[data-theme="dark"]` / `@media (prefers-color-scheme)` 变量块
2. `src/main.js` 中 `import './styles/variables.css'`
3. App.vue `<style>` 中删除对应块

### 涉及

- `src/styles/variables.css`（新建）
- `src/main.js`（加 import）
- `src/App.vue`（删 50 行）

### 验证

- `vite build` 零错误，CSS 产物内容不变
- 页面加载：深色/浅色切换正常

---

## 执行顺序

```
任务一（5min）→ 构建验证
任务二（15min）→ 构建+手动测试
任务三（20min）→ 构建+手动测试
任务四（10min）→ 构建对比 CSS 不变
```

---

## 确认清单

| # | 项 | 确认 |
|---|-----|------|
| 1 | 图片 > 2MB 用 `confirm` 给用户选择权（而非直接拒绝） | ⬜ |
| 2 | Markdown 导出按钮放在「一键打开微信后台」上方 | ⬜ |
| 3 | CSS 变量拆 `src/styles/variables.css` | ⬜ |
| 4 | 每步构建验证 | ⬜ |
