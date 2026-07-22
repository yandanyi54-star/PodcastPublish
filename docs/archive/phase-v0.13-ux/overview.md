# 净排 v0.13.2 修复总结

## 修复了什么

两个根因已彻底定位并修复（均经 puppeteer 真机回归验证，5/5 通过）。

### 1. 按 Enter 凭空冒出「幽灵封面卡片」
- **根因**：装饰节点 `cover/divider/quote` 必须注册在 `commonmark` 之前，`:::` 才能被解析为容器节点。这导致它们成为 schema 中**排在最前的 textblock**。于是 ProseMirror `splitBlock` 的 `defaultBlockAt()` 在普通段落末尾按 Enter 时，把"新块类型"误判成了 `cover`，插入了一个空 cover 节点（渲染成封面卡片；序列化后又被 `stripBareDirectives` 清除，所以刷新/预览后消失——与你的描述完全吻合）。
- **修复**：新增 `src/plugins/forceParagraphEnter.js`，在普通段落按 Enter 时**强制以 paragraph 作为 split 新块类型**，绕开 `defaultBlockAt` 误判。刻意不改 schema 顺序 / attrs（否则会破坏 `:::` 解析）。注册在 `headingEnterFix` 之前，标题/列表/代码块仍走各自的默认处理。
- **验证**：干净文档普通段落末尾 Enter → `covers=0`、doc 末尾为 `paragraph`。封面卡内 Enter 不扩散（仍 1 张）。

### 2. 装饰块（`::: cover` 等）在编辑器内从未渲染成卡片
- **根因（更关键）**：一直写成 `::: cover`（带空格），但 `remark-directive` 3.x **只认 `:::cover`（无空格）**，带空格会被当成纯文本。预览（`buildHtml.js` 用独立正则）一直正常，编辑器用 remark 流水线却从不解析——造成编辑器/预览不一致，且封面/金句标题文字会丢失。
- **修复（全链路统一为 `:::cover`）**：
  - `insertDecorBlock` 输出 `:::cover\n\n:::`（无空格）
  - `buildHtml.js` 正则改为 `::: ?(\w+)`（同时兼容新旧写法）
  - `stripBareDirectives` 裸检测修正
  - `createDirectiveNode` 的 `parseMarkdown.runner` 改为**递归收集所有文本**（修复封面/金句标题丢失）
- **验证**：加载 `:::cover / :::divider / :::quote` 草稿 → 编辑器正确渲染 1+1+1 张卡片且文字上屏。

## 验证方式
- 生产构建通过（`vite build`，Milkdown 体积告警为历史遗留，非本次引入）。
- `probe_verify.mjs`（puppeteer-core 驱动系统 Chrome）5 项断言全 PASS，保留为回归测试。

## 遗留项（非本次范围）
- 你之前提到的**深色模式 bug** 仍未修；可先开浅色版：`http://localhost:3000/?theme=light`。
- 项目根目录残留 `.chrome-profile/`（40M puppeteer 临时目录，已加入 `.gitignore`）。本机安全删除钩子在该系统上拒绝执行删除，需你手动从资源管理器删除。
