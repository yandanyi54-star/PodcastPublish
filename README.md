# 净排 · 纯本地公众号排版工具

> 📐 纯本地 · 不登录 · 文章不出本机，排版照样好看。

**净排**是一个纯前端的公众号 Markdown 排版工具。你写 Markdown，它生成带排版样式的 HTML，一键复制到微信后台。全程在浏览器中完成，不上传任何内容到服务器。

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000）
npm run dev

# 构建生产包
npm run build

# 预览构建产物
npm run preview
```

---

## 功能特性

| 功能 | 说明 |
|------|------|
| ✍️ **所见即所得编辑器** | Milkdown WYSIWYG，无需记 Markdown 语法 |
| 🎨 **10 套主题模板** | 商务蓝调 / 暖咖生活 / 墨韵文心 / 学堂笔记 / 森系自然 / 霓虹赛博 / 橘光活力 / 经典报业 / 知性学术 / 极简留白 |
| 🖼️ **装饰元素** | 封面卡片 / 装饰分割线 / 金句引用，一键插入 |
| 🤖 **AI 写作助手** | 生成标题 / 写摘要 / 扩写 / 结构化排版（需自备 API Key） |
| 🎯 **品牌色一键重染** | 设定品牌主色，标题/链接/引用自动跟随 |
| 🌗 **深色模式** | 浅色 / 深色 / 跟随系统，三态切换 |
| 📱 **移动端适配** | 手机 / 平板 / 桌面，三档断点自适应 |
| 🔒 **纯本地存储** | 内容仅存在你的浏览器，关掉页面也不丢 |
| 📥 **导入提纯** | 粘贴网页 HTML，自动转成干净 Markdown |
| 📤 **一键导出** | 下载样式 HTML / 纯 Markdown / 直接打开微信后台 |

---

## 技术栈

| 工具 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | UI 框架（Composition API） |
| [Vite 5](https://vitejs.dev/) | 构建工具 |
| [Milkdown](https://milkdown.dev/) | WYSIWYG 编辑器（基于 ProseMirror） |
| [marked](https://marked.js.org/) | Markdown → HTML 渲染 |
| [DOMPurify](https://github.com/cure53/DOMPurify) | XSS 防护 |
| [Turndown](https://github.com/mixmark-io/turndown) | HTML → Markdown 转换 |
| [Vitest](https://vitest.dev/) | 单元测试 |

---

## 项目结构

```
净排/
├── src/
│   ├── main.js                 # 应用入口
│   ├── App.vue                 # 全部 UI 与逻辑（~2800 行）
│   ├── themes.js               # 10 套主题数据 + 中文标签
│   ├── buildHtml.js            # Markdown→HTML 排版管线 + 装饰元素渲染
│   ├── callAI.js               # AI 调用（依赖注入模式）+ 取消功能
│   ├── darkTheme.js            # v0.13.3 暗色主题派生（编辑器/微信深色）
│   ├── plugins/
│   │   ├── headingEnterFix.js  # 标题末尾 Enter → paragraph 修正
│   │   └── forceParagraphEnter.js # 根治 Enter 幽灵封面（v0.13.2）
│   ├── composables/            # useBrand / useDraft / useStyle
│   ├── components/             # 6 个 .vue 组件
│   └── styles/variables.css    # 设计基座（颜色/字体变量）
├── docs/
│   ├── STANDARDIZATION.md      # ⭐ 项目标准流程（新成员/新对话先读此文件）
│   ├── CODING_STANDARDS.md     # 编码规范
│   ├── RELEASE_CHECKLIST.md    # 发布检查清单
│   ├── code-review-standards.md
│   ├── templates/              # PRD/ADR 模板
│   ├── PRD/                    # 产品需求文档
│   └── archive/                # 按阶段归档的历史规划/评审
│                               #   phase-pre-milkdown / phase-v0.13-ux / phase-v0.14-bugfix / debug-scripts
├── tests/                      # 12 个单元测试（buildHtml / callAI / 装饰 / 暗色 等）
├── CHANGELOG.md                # 版本历史
├── index.html                  # HTML 入口
├── package.json
├── vite.config.js
├── vitest.config.js
└── eslint.config.js
```

---

## 设计理念

### 纯本地

净排的核心承诺：**你的内容永远只存在你的设备上。**

- 所有数据存在浏览器 `localStorage`
- 零后端、零数据库、零内容上传
- 外部 API 调用仅限用户主动触发的 AI 请求
- 无分析/埋点/CDN 追踪

### 排版即复制

不保存、不发帖、不发布。排版就是生成一段带样式的 HTML，粘贴到微信后台就完事。

---

## 标准化流程

> 详细标准流程定义见 [`docs/STANDARDIZATION.md`](docs/STANDARDIZATION.md)

净排建立了覆盖"需求→设计→开发→质量→文档→发布"全链路的 6 大标准流程：

1. **PRD** — 每个功能先写需求文档
2. **ADR** — 每个架构决策记录原因
3. **开发规范** — ESLint + Prettier + 编码约定
4. **质量保障** — 测试 + 代码审查
5. **项目文档** — README / CHANGELOG / 架构图
6. **发布迭代** — 版本策略 + 发布检查清单

---

## 贡献指南

1. 新功能先写 PRD（见 `docs/templates/PRD-模板.md`）
2. 涉及架构决策写 ADR（见 `docs/templates/ADR-模板.md`）
3. 代码遵循 `docs/CODING_STANDARDS.md`
4. 提交 PR 前确保 `npm run check` 通过
5. PR 通过审查后 squash-merge

---

## 版本历史

见 [`CHANGELOG.md`](CHANGELOG.md) — 从 v0.1.0 到 v0.14.2 的完整迭代记录，每条更新均附验收清单。

---

## 许可证

MIT
