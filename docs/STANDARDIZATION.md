# 净排 · 标准化流程建设任务书

> 本文档是净排项目的"宪法"——无论人类开发者还是 AI 助手，首次接触项目时都应先读此文件。
> 它定义了项目的标准流程、文档规范、工具链和协作共识。
>
> 文档版本：v1.0 · 2026-07-17

---

## 目录

1. [项目概述](#1-项目概述)
2. [六⼤核心流程](#2-六⼤核心流程)
3. [流程详解与产出物](#3-流程详解与产出物)
4. [工具链配置](#4-工具链配置)
5. [角色与职责](#5-角色与职责)
6. [实施路线图](#6-实施路线图)
7. [常见问题](#7-常见问题)

---

## 1. 项目概述

### 1.1 一句话

**净排**是一个纯本地、不登录、内容不出本机的公众号 Markdown 排版工具。用户写好 Markdown，一键排版、一键复制到微信后台。

### 1.2 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 构建 | Vite 5 |
| 编辑器 | Milkdown v7 (WYSIWYG，基于 ProseMirror) |
| 排版管线 | marked + DOMPurify + THEMES 数据驱动 |
| 测试 | Vitest |
| 代码规范 | ESLint + Prettier |

### 1.3 核心约束

- **纯前端**：零后端、零数据库、零内容上传
- **隐私优先**：无分析/埋点/CDN 追踪
- **单文件现状**：`src/App.vue` ~3273 行，组件拆分是长期目标
- **不可改动**：`buildHtml` 排管线、`THEMES` 主题数据、AI 业务核心逻辑

### 1.4 项目结构

```
净排/
├── src/
│   ├── main.js           # 入口
│   └── App.vue           # 全部 UI 与逻辑（~3273 行）
├── docs/
│   ├── STANDARDIZATION.md      # ← 本文档（项目宪法）
│   ├── CODING_STANDARDS.md     # 编码规范
│   ├── RELEASE_CHECKLIST.md    # 发布检查清单
│   ├── code-review-standards.md # 代码审查标准（已有）
│   ├── templates/
│   │   ├── PRD-模板.md         # PRD 模板
│   │   └── ADR-模板.md         # ADR 模板
│   ├── spec-ux-high-priority-v1.0.md  # UX 规格（已有）
│   ├── ux-optimization-plan.md        # UX 优化计划（已有）
│   ├── milkdown-feasibility-assessment.md  # 技术评估（已有）
│   ├── milkdown-migration-plan.md         # 迁移计划（已有）
│   ├── milkdown-migration-spec.md         # 迁移规格（已有）
│   └── bug-fix-plan.md                    # Bug 修复计划（已有）
├── tests/
│   ├── buildHtml.test.js   # 核心排管线测试
│   └── callAI.test.js      # AI 功能测试
├── dist/                   # 构建产物（gitignore 已排除）
├── node_modules/           # 依赖（gitignore 已排除）
├── CHANGELOG.md            # 版本历史（已有，详尽的）
├── README.md               # 项目简介
├── package.json
├── vite.config.js
├── eslint.config.js
├── .prettierrc
└── .editorconfig
```

---

## 2. 六大核心流程

净排的标准化体系覆盖从需求到发布的完整链路：

```
需求（PRD）→ 设计（ADR）→ 开发（规范约束）→ 质量（测试+审查）→ 文档（沉淀）→ 发布（检查清单）
```

每个流程的**产出物**和**负责人**如下：

| # | 流程 | 产出物 | 负责人 | 优先级 |
|---|------|--------|--------|--------|
| 1 | 📋 产品需求 | `docs/PRD/*.md` | 产品/项目 Owner | P1 |
| 2 | 🏗️ 技术设计 | `docs/design/ADR-*.md` | 前端开发 | P1 |
| 3 | 🔧 开发规范 | ESLint/Prettier/EditorConfig | 前端开发 | **P0** |
| 4 | ✅ 质量保障 | 测试文件 / 审查记录 / PR 模板 | 开发+审查专家 | P1 |
| 5 | 📖 项目文档 | README / 架构图 / CHANGELOG | 项目 Owner | **P0** |
| 6 | 🚀 发布迭代 | RELEASE_CHECKLIST.md | 项目 Owner | P1 |

> **P0 = 必须立即做**（影响日常开发和项目展示）
> **P1 = 按节奏推进**（影响质量和可维护性）

---

## 3. 流程详解与产出物

### 3.1 流程一：产品需求（PRD）

**目标**：每个功能都有明确的需求定义和验收标准。

**产出物**：`docs/PRD/<功能名称>.md`

**模板**：见 `docs/templates/PRD-模板.md`

**要求**：
- 每个新功能必须先写 PRD
- 验收标准必须可量化（如"冷启动 20 次，渲染率 100%"）
- 明确标注"不做什么"（边界约束）

**已有示例**：`docs/spec-ux-high-priority-v1.0.md` → 后期可整理为标准 PRD 格式

---

### 3.2 流程二：技术设计（ADR）

**目标**：记录架构决策的原因，避免"当时为什么这么做"的困惑。

**产出物**：`docs/design/ADR-<序号>-<标题>.md`

**模板**：见 `docs/templates/ADR-模板.md`

**触发条件**（任一）：
- 引入新的外部依赖
- 修改核心排管线（`buildHtml` / `THEMES`）
- 组件拆分方案
- 迁移/重构计划

**已有示例**：`docs/milkdown-feasibility-assessment.md` 和 `docs/milkdown-migration-spec.md` 本质上是 ADR，后续可整理为标准格式。

---

### 3.3 流程三：开发规范

**目标**：代码风格一致，可读性高，自动化检查。

**产出物**：

| 文件 | 作用 | 优先级 |
|------|------|--------|
| `.editorconfig` | 缩进/换行符统一 | P0 |
| `.prettierrc` | 代码格式化 | P0 |
| `eslint.config.js` | 代码质量检查 | P0 |
| `docs/CODING_STANDARDS.md` | 命名/注释/文件组织约定 | P0 |

**Git 提交规范**：

```
<type>(<scope>): <简短描述>

feat:     新功能
fix:      修复 Bug
refactor: 重构（不改变外部行为）
style:    样式/格式变动（非功能性）
docs:     文档
chore:    工程/构建/工具链
test:     测试
```

示例：
```
feat(editor): 添加本地图片拖拽上传功能
fix(preview): 修复深色模式下预览区文字不可见
chore: 配置 ESLint + Prettier
docs: 更新 CHANGELOG v0.11.0
```

---

### 3.4 流程四：质量保障

#### 3.4.1 代码审查

沿用 `docs/code-review-standards.md` 的全部规则：

- 🔴 **Blocker**：必须修复，合并前 resolved
- 🟡 **Suggestion**：建议修复，至少讨论过
- 💭 **Nit**：小优化，可选

审查流程（自 code-review-standards.md 第 1 节）：

```
PR 提交 → 自动检查（CI Gate）→ 代码审查 → 合并前检查 → 合并
```

#### 3.4.2 测试覆盖

按优先级逐步覆盖（详见 CODING_STANDARDS.md）：

| 优先级 | 测试目标 | 工具 |
|--------|---------|------|
| P0 | `buildHtml()` 核心排版管线 | Vitest |
| P0 | `callAI()` 边界情况 | Vitest |
| P1 | `THEMES` 数据完整性 | Vitest |
| P1 | 装饰元素处理逻辑 | Vitest |
| P2 | UI 组件渲染 | Vitest + @vue/test-utils |
| P2 | 导入提纯 | Vitest |

**测试原则**：
- 只测纯逻辑，不测 DOM 渲染
- 核心管线（buildHtml）必须覆盖
- 初期不追求覆盖率指标

---

### 3.5 流程五：项目文档

| 文件 | 作用 | 更新频率 |
|------|------|---------|
| `README.md` | 项目名片 | 大版本更新时 |
| `CHANGELOG.md` | 版本历史（已有，保持风格） | 每次发版 |
| `docs/CODING_STANDARDS.md` | 编码规范 | 引入新规则时 |
| `docs/STANDARDIZATION.md` | ⭐ 项目宪法（本文档） | 流程变化时 |

**CHANGELOG 写作规范**（保持现有风格）：

```markdown
## [日期] 版本标题（vX.X.X）

> 🎯 来源：PRD 或 Spec 链接

### 1. 新增功能（New）
- **功能名称**：详细描述

### 2. Bug 修复（Fixed）
- **问题**：描述 + 根因 + 修复方式

### 3. 代码质量（Chores）
- 清理/配置/工具链变动

### 检查官必看
- [ ] 验收项 1
- [ ] 验收项 2
```

---

### 3.6 流程六：发布与迭代

**版本策略**：

| 阶段 | 版本号 | 示例 |
|------|--------|------|
| 功能迭代 | v0.X.0 → v0.(X+1).0 | v0.10.0 → v0.11.0 |
| Bug 修复 | v0.X.Y → v0.X.(Y+1) | v0.10.0 → v0.10.1 |
| 首次稳定版 | v0.x.0 → v1.0.0 | 全部上线后 |

**发布前清单**：见 `docs/RELEASE_CHECKLIST.md`

---

## 4. 工具链配置

### 4.1 已安装

```bash
npm install --save-dev \
  eslint \
  @eslint/js \
  eslint-plugin-vue \
  prettier \
  vitest \
  jsdom
```

### 4.2 npm scripts 说明

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产包 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 |
| `npm run test` | 运行测试 |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run check` | 全量检查（lint + test + build） |

---

## 5. 角色与职责

| 角色 | 职责 |
|------|------|
| **项目 Owner**（你） | PRD 编写、README/CHANGELOG 维护、发布决策、流程监督 |
| **前端开发** | 代码实现、ADR 编写、测试编写、ESLint/Prettier 维护 |
| **代码审查专家** 👁️ | 按 `code-review-standards.md` 逐项审查 PR、标注 🔴/🟡/💭 |
| **AI 助手**（WorkBuddy） | 按本文档理解项目规范，辅助编写 PRD/ADR/测试/文档 |

---

## 6. 实施路线图

三个阶段，每阶段 1-2 天：

### 阶段一：基础架设（第 1-2 天）

| 任务 | 产出 | 负责人 |
|------|------|--------|
| 配置 ESLint + Prettier + EditorConfig | `eslint.config.js` / `.prettierrc` / `.editorconfig` | 前端 |
| 安装 devDependencies + 添加 npm scripts | `package.json` 更新 | 前端 |
| 编写 README.md | `README.md` | Owner |
| 编写 CODING_STANDARDS.md | `docs/CODING_STANDARDS.md` | 前端 |

### 阶段二：文档完善（第 3-4 天）

| 任务 | 产出 | 负责人 |
|------|------|--------|
| 建立 PRD/ADR 模板 | `docs/templates/PRD-模板.md`、`docs/templates/ADR-模板.md` | Owner |
| 编写 RELEASE_CHECKLIST.md | `docs/RELEASE_CHECKLIST.md` | Owner |
| 核对文档是否齐全 | 所有文档映射到位 | Owner |

### 阶段三：质量建设（第 5-7 天）

| 任务 | 产出 | 负责人 |
|------|------|--------|
| 安装 Vitest + 配置 | `vitest.config.js` | 前端 |
| 写 buildHtml 测试 | `tests/buildHtml.test.js` | 前端 |
| 写 callAI 测试 | `tests/callAI.test.js` | 前端 |
| 全流程走通一次 | 提一个 PR → 审查 → 合并 | 全员 |

---

## 7. 常见问题

### Q: 小修改也需要写 PRD 吗？

不需要。PRD 只针对**有明确用户价值**的新功能。Bug 修复、重构、样式调整只需在 PR 描述中说明即可。

### Q: 文档和代码哪个优先？

**P0 的基础配置（ESLint/Prettier/EditorConfig/README）必须最先做**，因为它们影响日常开发效率。
PRD 和 ADR 可以在开发新功能时一起写。

### Q: 测试没覆盖到怎么办？

先写核心管线（buildHtml）的测试。UI 交互测试优先级最低，手动验证即可。

### Q: 我如何在新的 AI 对话中快速恢复上下文？

告诉 AI 助手：
1. 读 `docs/STANDARDIZATION.md` — 了解项目标准流程
2. 读 `CHANGELOG.md` — 了解项目当前状态和历史
3. 读对应的 PRD/ADR/文档 — 了解当前任务的上下文

---

> 📐 **净排** · 纯本地 · 不登录 · 文章不出本机，排版照样好看。
