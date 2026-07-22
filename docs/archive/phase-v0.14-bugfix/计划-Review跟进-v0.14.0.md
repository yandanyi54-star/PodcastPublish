# 执行计划：Review 跟进 (v0.14.0)

> 日期：2026-07-18
> 来源：`docs/design/Review-2026-07-18.md`
> 基线：App.vue 3783 行，6 模块（3 组件 + 3 composable）

---

## 第一梯队：Bug 修复 + 版本号（30 分钟，本次完成）

| ID | 任务 | 工作量 | 验证 |
|----|------|--------|------|
| **B-1** | 修复 `deleteCurrentImage`：改用 `setEditorMarkdown` Markdown 路径 | 15 分钟 | 手动：点击图片→删除→图片消失 |
| **B-2** | 修复 `updateImageWidth`：同上，Markdown 路径 | 10 分钟 | 手动：调宽度滑块→图片宽度变化 |
| **B-3** | 修复 `insertImage` 后撤销：确保 ProseMirror history 不被打断 | 15 分钟 | 手动：插入图片→Ctrl+Z→图片消失 |
| **B-4** | `package.json` 版本号 `0.12.0` → `0.13.0` | 1 分钟 | 肉眼确认 |

> 注：B-1~B-3 的方案参照 ADR 结论——上下文工具栏图片操作全部回退到 Markdown 文本路径（`matchImageBySrc` + `setEditorMarkdown`），放弃 ProseMirror 事务路径以避免 Milkdown sync gap。

---

## 第二梯队：快速拆分 + 清理（1~2 小时）

| ID | 任务 | 关键点 | 减少行数 |
|----|------|--------|---------|
| **S-3** | 拆 `ExportPanel.vue` | 纯展示面板，props 最少（3 个） | -45 行 |
| **S-4** | 拆 `SettingsPanel.vue` | 包含品牌色/字体，props 5 个 | -35 行 |
| **Q-2** | 清理 `dist*/` 废目录 | `git rm -r dist-bak-20260715/` | — |
| **Q-3** | 加 FIXME 注释 | 在 4 个已知问题函数上加 `// FIXME(B-1): ...` | — |
| **Q-5** | 审计 App.vue import | 移除 `THEMES`/`THEME_NAMES` 等已搬运但未删导入 | — |

> 每步验证：`vite build` + `vitest run`

---

## 第三梯队：深度拆分 + 工程（下个迭代）

| ID | 任务 | 关键点 | 预估 |
|----|------|--------|------|
| **S-6** | 拆 `useAI.js` | AI 配置读写 + 预设切换逻辑 | -65 行 |
| **S-1** | 拆 `DecorPanel.vue` | 装饰元素 + 图片上传面板 | -65 行 |
| **S-2** | 拆 `ImportPanel.vue` | 导入面板，最简单 | -25 行 |
| **S-5** | CSS 独立 | 783 行 → `src/styles/app.css` | -783 行 |
| **Q-1** | 代码分割 | Milkdown 系拆独立 chunk | bundle < 500KB |

> 目标：App.vue ≤ 2800 行

---

## 长期：UX 增强 + 质量

| ID | 任务 | 说明 |
|----|------|------|
| **A-5** | Markdown 导出 | 在导出面板加「导出 Markdown」按钮 |
| **A-2** | 图片大小限制 | 上传时警告 > 2MB |
| **Q-4** | 补充测试 | Onboarding / 上下文工具栏 / AI 推荐 smoke test |
| **Q-6** | Milkdown 版本审计 | 评估 v7 → v8 升级收益 |
| **A-1** | 移动端真机测试 | iPhone/Android 跑全流程 |

---

## 每步验证协议

```
vite build  →  零错误
vitest run  →  31 tests pass
手动检查    →  目标功能在预览中正常工作
git commit  →  单任务一颗 commit
```

## 当前迭代执行确认

| # | 项 | 确认 |
|---|-----|------|
| 1 | 先做第一梯队 B-1~B-4（Bug 修复） | ⬜ |
| 2 | 再做第二梯队 S-3/S-4（面板拆分） | ⬜ |
| 3 | 第三梯队留到下次迭代 | ⬜ |
| 4 | 每个 task 一颗 commit | ⬜ |
