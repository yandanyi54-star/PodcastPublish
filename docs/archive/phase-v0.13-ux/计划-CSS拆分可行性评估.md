# 净排 CSS 拆分 — 可行性评估与实施计划

> 背景：v0.14.0 已修复 3 个功能 bug（字间距、跟随系统、AI 选中替换）。此前计划（UX架构实施计划 P1-3 模块拆分、UX架构重设计 `tokens.css`）提到过"拆分 CSS"。本文先评估可行性，再给出可执行的增量计划。
> 核实日期：2026-07-21

---

## 一、当前事实（已逐条核实）

| 项 | 数据 |
|---|---|
| `App.vue` 总行数 | **3484 行** |
| 全局非 scoped `<style>` 块 | 1675–3439 行，**约 1764 行 CSS，占文件 51%** |
| scoped `<style>` 块 | 3440 起，仅 Milkdown 编辑器样式 |
| `src/styles/variables.css` | 已抽离（1853 B）：设计令牌（颜色/阴影/圆角/过渡 + 深浅色变量） |
| 已抽离的组件 | AIPanel / AppearancePanel / ExportPanel / PreviewPanel / PublishWizard / ThemeModeSwitch（逻辑+模板） |
| **关键债务** | AIPanel / AppearancePanel / ExportPanel / PreviewPanel **完全没有自己的 `<style>`** —— 它们用的 `.preview-*` / `.floating-panel` / `.notion-*` / `.ai-*` / `.appearance-*` / `.export-actions` 等**全部定义在 App.vue 的全局块里** |
| 构建产物 CSS | `dist/assets/index-*.css` **单文件 30.5 KB**（Vite 已把所有 CSS 合并） |

---

## 二、可行性评估

### 1. ❌ "拆成多个 CSS 文件以优化性能/体积" —— 不可行 / 无意义（对本题）

- 单页应用、无路由级懒加载，所有 CSS 首屏必载。Vite `build` 时无论源码分多少个 `.css`，最终都合并为 **1 个 `index.css`**。
- 拆分**不会**减小总字节、**不会**提升 LCP/FID/CLS、**不会**减少首屏请求。
- 结论：**不要以"性能/体积"为由拆 CSS 文件**。旧计划（UX架构实施计划 §632）自己已写明"拆分后产物体积不变"——自证了这一点。

### 2. ✅ "把现全局样式按归属拆分到各自组件（ownership split）" —— 可行且有价值

- **真实痛点**：4 个已抽离组件没有自己的样式。改 AIPanel 的样式要跑到 App.vue 1700 行外去翻；无 scoped，一个 class 改名/删除会悄悄影响其它面板；新人无法判断哪段 CSS 服务哪个组件。
- **技术可行性**：Vue SFC 原生 `<style scoped>` 正是为这种场景设计。把 `.preview-*` 移入 PreviewPanel、`.ai-*` 移入 AIPanel、`floating-panel/panel-*` 抽成共享、`notion-*` 抽成共享基础样式，完全可行。
- **收益**：可维护性 ↑、回归风险 ↓（scoped 后组件样式不会误伤别人）；**不改变运行时行为**（规则原样搬，选择器不变，产物一致）。

### 3. ⚠️ 风险

- **全局→scoped 改变层叠**：若某 class 既被 App.vue 外壳用、又被子组件用，搬走后外壳侧会丢样式 → 视觉回归。必须逐个组件 dev 目检。
- **新敏感区**：刚落地的"跟随系统"修复动了 `variables.css` 与 `data-theme` 选择器链路。拆分时**严禁碰** `:root[data-theme="dark"]` / 深浅色变量 / `variables.css` —— 这些必须保留在全局。
- **历史雷区**：Enter 幽灵封面、装饰渲染不在 CSS 范围，但回归验证仍要跑 `probe_verify.mjs`。

### 4. 与"旧计划"的关系

- 旧计划（2026-07-17 P1-3）已**大体落地**（组件 + composables 已抽），工作记忆判定其"过期"。
- 真正没完成的是**样式没跟着组件走**这一半。所以本任务不是"从头再拆 App.vue"，而是"补齐已拆组件的样式归属"——范围更小、风险更低、收益更确定。

---

## 三、结论

- ✅ **可行，且建议做**，但**重新定义为"组件样式归属拆分"（ownership split）**，而非"拆 CSS 文件换性能"。
- 不碰 `variables.css` 与外壳深浅色变量（全局必须保留）。
- 增量、逐组件进行，每步 dev + `probe_verify` + 目检 + commit，杜绝大爆炸式重构。

---

## 四、实施计划（增量、可回滚）

### 阶段 0：基线（约 0.5h）
- `vitest run` 全绿（≥55）+ `vite build` 通过，记录当前 CSS 体积（30.5 KB）。
- 启动 dev server，`probe_verify.mjs` 截图存档视觉基线（预览框、4 面板、深/浅色、跟随系统）。

### 阶段 1：抽出共享基础样式 `src/styles/base.css`（约 1.5h）
- 把全局块里**被多组件复用**的通用类迁出：`notion-btn-*` / `notion-input` / `notion-select` / `notion-range` / `floating-panel` / `panel-header|content|close|tip` / `control-group|label|row|value` / `primary` 等。
- 这些保持**全局引入一次**（不 scoped），比每个组件复制一份更优。
- 凡"也用于 App.vue 外壳"的类（如 `floating-panel` 还服务于装饰/导入面板）留在 `base.css`，不搬进子组件。

### 阶段 2：逐组件归属拆分（每组件 1 commit，风险从低到高）
1. **PreviewPanel**（`.preview-*` ≈ 175 行）→ 自身 `<style scoped>`。
2. **ExportPanel**（`.export-actions` 等）→ 自身 scoped。
3. **AIPanel**（`.ai-*` / `.ai-rec-*` + 阶段1共享的 notion）→ 自身 scoped。
4. **AppearancePanel**（`.appearance*` / `.theme-dot` / `.apply-all-btn` / 主题选择器）→ 自身 scoped。
- 每步：移动 → `npm run dev` 目检该面板 → `probe_verify.mjs` 回归 → commit。

### 阶段 3：收尾 App.vue（约 1h）
- 仅保留 **App.vue 自身拥有**的样式：`.app-root`、工具栏、拖拽分隔、空状态、状态栏、上下文工具栏、恢复横幅、新手引导、快捷键浮层、Milkdown scoped 块、过渡动画、移动端适配。
- 预期：App.vue 3484 → **约 2000 行内**（逻辑+模板+自身样式）；CSS 块从 ~1764 行降至外壳 ~600–800 行。

### 阶段 4：验证与回归（约 1h）
- `vitest run` 全绿（≥55）。
- `vite build` 通过，产物 CSS **仍单文件、体积 ±1 KB 内**（仅因去重/合并）。
- 手动核对清单：4 面板样式无缺失/错位；深/浅色与"跟随系统"（OS 切浅/深）外壳=编辑区一致；Enter 幽灵封面、装饰渲染仍正常（`probe_verify`）。

### 可选增强（不阻塞）
- 把 `variables.css` 升级为更完整的 `tokens.css` 设计基座（间距/字号阶梯/z-index 令牌化），呼应旧计划 B10。属附加项。

---

## 五、投入估算

| 阶段 | 耗时 |
|---|---|
| 0 基线 | 0.5h |
| 1 base.css | 1.5h |
| 2 四组件逐个 | 4–6h |
| 3–4 收尾+验证 | 2h |
| **合计** | **约 1–1.5 天** |

> 低于旧计划 P1-3 估的 4–6h 纯拆分——因为组件外壳已就绪，本次只剩样式搬移。

---

## 六、建议

- 这是**重构**，无用户可见新功能。刚修完 3 个功能 bug，建议等当前修复分支完全稳定（vitest 全绿 + 真机目检）后再启动，避免"功能回归"与"样式回归"混在一起难定位。
- 若近期还要动 **发布闭环 / 装饰解耦 / 响应式打磨**（工作记忆里的真实缺口），可把对应组件的样式归属顺手一并做，减少重复开 dev server 的次数。
- 优先级判断：CSS 归属拆分是**可维护性投资**，不是阻塞项。若排期紧张，可排到下个迭代，不影响发版。
