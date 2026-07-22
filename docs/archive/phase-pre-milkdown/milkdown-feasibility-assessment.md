# Milkdown 迁移可行性评估报告

> 评估日期：2026-07-15
> 评估对象：`milkdown-migration-plan.md` + `milkdown-migration-spec.md`
> 结论：**方案整体可行，但存在 1 个高风险卡点和 3 处事实性偏差需修正**

---

## 一、总体判断

| 维度 | 评级 | 说明 |
|------|------|------|
| 战略方向 | ✅ 可行 | "换编辑器、保管线"策略将风险限制在 UX 层，不动复制管线 |
| 技术路线 | ⚠️ 需修正 | `:::` 语法往返假设有误，需引入 remark 插件，Phase 2 工程量被低估 |
| 安全策略 | ⚠️ 需修正 | 项目已有 Git 仓库，手动 `cp -r` 备份策略过重 |
| 风险控制 | ✅ 合理 | POC 优先 + 保留预览面板作对照，思路正确 |
| 工程量估算 | ⚠️ 偏乐观 | 合计约 +160 行，实际可能 +250~400 行 |

---

## 二、关键发现（按严重度排序）

### 🔴 发现 1：`:::` 语法默认不会往返（高风险，影响核心策略）

**计划假设**（plan L61, spec L127）：
> `::: cover` 在 Milkdown 中输入后，`getMarkdown()` 能原样输出

**实际情况**：
Milkdown 底层用 remark 解析 Markdown。`::: container` **不是标准 Markdown 语法**，commonmark 预设不会识别它。输入 `::: cover\n标题\n:::` 后，Milkdown 会将其解析为普通段落文本，`getMarkdown()` 输出的结果可能是：
- 段落文本拼接（`::: cover 标题 :::`）
- 或换行被吞掉

**不会**原样保留 `::: cover\n标题\n:::` 三行结构。

**验证来源**：Milkdown 官方文档和社区实践表明，要支持 `:::` 语法需要：
1. 引入 `remark-directive` 插件（解析 `:::` 语法为 AST 节点）
2. 定义自定义 ProseMirror node schema（`$nodeSchema` 或 `$node`）
3. 编写 `parseMarkdown` / `toMarkdown` runner（往返映射）
4. 编写 input rule（`::: type` 触发节点创建）
5. 编写 node view（编辑器内渲染效果）

这是 **~150-200 行插件代码**，计划将其放在 Phase 2 并标为"工程量最大"是合理的，但 Phase 0 的 POC H1 假设写的是"往返正常"，实际上**默认一定会失败**。

**影响**：
- 如果 POC H1 失败后才发现需要 remark 插件，Phase 2 的工作量从 +200 行变成 +350~400 行
- 如果不做 remark 插件，`:::` 语法在编辑器里会变成不可控的纯文本，用户编辑体验更差
- 更深层影响：`:::` 语法是"换编辑器、保管线"策略的**唯一耦合点**。如果语法不能往返，管线就保不住了

**建议**：
- POC 增加假设 H1.5：**用 `remark-directive` + 自定义 node 实现往返**
- 验证内容：`::: cover\n标题\n:::` → 编辑器内渲染为封面卡片 → `getMarkdown()` 输出 `::: cover\n标题\n:::`
- 如果 H1.5 也失败 → 考虑替代方案：编辑器内用标准 blockquote + CSS 标记，buildHtml 管线做语法转换

---

### 🟡 发现 2：项目已有 Git 仓库（事实偏差，影响备份策略）

**计划声明**（spec L13）：
> 当前项目**没有 git 仓库**，版本管理靠手动 `dist → dist-bak-xxx` 重命名

**实际情况**：
```bash
$ git log --oneline -5
a24a109 chore: 清理仓库 — 移除旧模板残留和构建产物，仅保留源码
2becea5 docs: 更新 README，品牌名净排 JingPai
d9d44c6 v0.8.2: 当前稳定版本备份 — 迁移前基线
a42e15a chore: 添加 python-dotenv 依赖
4e6c547 merge: 解决 .gitignore 冲突
```

项目已有 Git，且有 `v0.8.2: 当前稳定版本备份 — 迁移前基线` 这个 commit 作为迁移基线。

**建议**：
- 用 `git checkout -b migration/milkdown` 创建迁移分支
- 每个 Phase 完成后 commit，出问题 `git reset --hard` 即可
- 不需要手动 `cp -r` 备份整个项目目录

---

### 🟡 发现 3：`getMarkdown()` 在 Kit API 下不是简单调用

**计划写法**（plan L213, spec L186）：
> `editor.action(getMarkdown())` 或 `onChange` 回调

**实际情况**：
- `getMarkdown()` 是 **Crepe API** 的方法，**Kit API 没有这个快捷方法**
- Kit API 需要手动实现：
```javascript
import { editorViewCtx, serializerCtx } from '@milkdown/kit/core'

const getMarkdown = (editor) => editor.action((ctx) => {
  const serializer = ctx.get(serializerCtx)
  const view = ctx.get(editorViewCtx)
  return serializer(view.state.doc)
})
```
- 监听内容变化需要额外引入 `listener` 插件：
```javascript
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
```

**影响**：不大，但计划中多处引用 `editor.action(getMarkdown())` 需要改成手动实现。代码量略增。

---

### 🟡 发现 4：包名不一致

**plan L193-197**（旧式分包）：
```
@milkdown/core, @milkdown/preset-commonmark, @milkdown/preset-gfm, @milkdown/vue, @milkdown/theme-nord
```

**spec L352-354**（新式伞包）：
```
@milkdown/kit, @milkdown/vue
```

**实际情况**：spec 是对的。Milkdown v7 推荐 `@milkdown/kit` 伞包（re-export core/preset/utils/prose），plan 中的分包写法是 v6 风格。

**当前最新版本**：`@milkdown/vue` v7.17.1 / `@milkdown/kit` 同步发版。计划写 `^7.19.1` 可能尚不存在，用 `^7.17.0` 更稳妥。

---

### 🟢 发现 5：中文输入法问题已修复但需验证

**计划风险**（plan L159）：
> ProseMirror 对 IME 有已知问题，需测试。Milkdown 7.x 已大幅改善

**实际情况**：
- 光标跳到行首的 bug 已在 2024 年 12 月通过 PR #1568 修复
- 但 `syncHeadingIdPlugin` 仍可能在某些场景下干扰输入法
- React 环境问题较多，Vue 环境相对稳定
- 临时解决方案：`editor.use(commonmark.filter(x => x !== syncHeadingIdPlugin))`

**结论**：POC H2 验证是必要的，但风险比预期低。Vue 环境 + 最新版本应该没问题。

---

### 🟢 发现 6：行号轻微漂移

计划写 App.vue 2737 行，实际 2743 行（+6 行）。所有行号引用偏差在 5 行以内，不影响定位。但建议执行前重新 `wc -l` 校准。

---

## 三、各阶段评估

### Phase 0（POC）— ⚠️ 需补充

| 评估项 | 结论 |
|--------|------|
| POC 优先策略 | ✅ 正确，"唯一免费试错机会"定位准确 |
| H1 假设 | ❌ 预设"往返正常"是错的，默认一定失败 |
| H2 假设 | ✅ 合理，需实际测试 |
| H3 假设 | ✅ 合理，技术可行 |
| 缺失 | 需增加 H1.5：remark-directive 方案验证 |

### Phase 1（编辑器替换）— ✅ 可行

| 评估项 | 结论 |
|--------|------|
| 编辑器替换 | ✅ `useEditor` from `@milkdown/vue` 是正确 API |
| 主题 CSS 注入 | ✅ `themeToCss()` 思路正确 |
| 预览面板保留作对照 | ✅ 优秀的决策 |
| 不用 theme-nord | ✅ 正确，避免与 THEMES 冲突 |
| 双向绑定 | ⚠️ 需要 listener 插件，计划未提及 |

### Phase 2（工具栏 + 装饰节点）— ⚠️ 工程量被低估

| 评估项 | 结论 |
|--------|------|
| 工具栏适配 | ✅ 思路正确 |
| `:::` 节点插件 | ⚠️ 需 remark-directive + node schema + input rule + node view，比预估多 150 行 |
| AI replaceAll | ✅ 可行 |
| `insertDecorBlock` 改造 | ✅ 可行 |

### Phase 3（移除预览）— ✅ 低风险

纯删除操作，风险可控。

---

## 四、修正建议汇总

1. **POC 增加 H1.5**：用 `remark-directive` + 自定义 node 验证 `:::` 往返
2. **备份策略改用 Git**：`git checkout -b migration/milkdown`，每 Phase 一个 commit
3. **修正 getMarkdown 实现**：用 serializer + editorView 手动实现
4. **修正包名**：统一用 `@milkdown/kit` + `@milkdown/vue`
5. **修正版本号**：`^7.17.0` 而非 `^7.19.1`
6. **Phase 2 工程量修正**：从 +200 行调整为 +350~400 行
7. **增加 listener 插件依赖**：Phase 1 需引入 `@milkdown/kit/plugin/listener`
8. **行号校准**：执行前重新 `wc -l src/App.vue`

---

## 五、最终结论

**方案可行，建议执行**，但需要：
1. 先做 POC（Phase 0），且必须包含 H1.5（remark-directive 验证）
2. 如果 H1.5 失败，需要重新评估装饰元素在 WYSIWYG 模式下的实现方式
3. 如果 H1.5 通过，按修正后的 Phase 1→2→3 顺序执行
4. 用 Git 分支替代手动备份

**一句话**：计划写得非常细致，安全策略和分阶段思路都到位。唯一的致命盲区是 `:::` 语法的往返假设——这个不补上，POC 的意义就打了一半折扣。
