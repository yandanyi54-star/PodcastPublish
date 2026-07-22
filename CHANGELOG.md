# 净排 · 版本更新日志

> 纯本地 · 不登录 · 文章不出本机，排版照样好看。
> 所有功能均为纯前端实现，无后端、无内容入库。

---

## [2026-07-22] 代码复查 · 可维护性加固 · 一键发布（v0.14.2）

> 🧹 全量代码复查（无阻断性 bug）+ 可维护性文档 + 发布自动化。纯前端、无后端、内容不出本机。

### 1. 代码质量（Chores）
- ESLint 恢复对 `.vue` 文件的审查（补 `vue-eslint-parser`），并清理 8 处整洁问题（未用导入 / 死代码 / `let`→`const` / DEV 日志规范化）；校验三件套 **lint 0 问题 · 测试 65 通过 · 构建成功**。
- `vite.config.js` 构建基路径改为相对路径 `./`，同一份产物在国内外托管（GitHub Pages / 国内镜像）均可直接打开。

### 2. 文档（Docs）
- 新增 `docs/维护指南.md`：「我想改 X → 改哪个文件」查表 + 发版 / 部署（全球版 GitHub Pages + 国内版 CloudStudio 镜像）/ 回滚 + 脆弱区红线。
- 新增 `docs/净排-代码复查报告-2026-07-22.md`：复查结论与修复清单。

### 3. 发布自动化（CI/CD）
- `package.json` 新增 `release`（发版前自动跑 检查 + 测试 + 构建 质量网）与 `deploy:github`（推 `dist/` 到 GitHub Pages）。
- `package.json` 的 `description` 统一为净排品牌口径。

### 4. 体验修复（Fixed）
- 全局快捷键（如 `Ctrl+Shift+C` 复制 HTML）在输入框 / 下拉聚焦时不再误触发，避免打断填写；编辑器（`contenteditable`）不受影响。

### 5. 仓库清理（Chores）
- `.gitignore` 增加 `.chrome-profile/`；移除误提交的历史构建产物（`dist-bak-*` / `dist-prev` / `dist-verify*` / `dist_r1` 等），仓库更整洁。

---

## [2026-07-21] 缺陷修复与打磨（v0.14.1）

> 🐛 修复 v0.14.0 审查发现的 3 个用户侧功能缺陷 + 6 个打磨项。纯前端、无后端、内容不出本机。

### 1. 功能缺陷修复（Fixed）
- **编辑器「字间距」滑杆失效**：`App.vue` 拼接 `letter-spacing` 时多余补了一次 `px`，产出非法 `0.5pxpx` 被浏览器丢弃（预览/导出正常，仅编辑器内失效）。现与 `buildHtml.js` 写法对齐。
- **AI「选中替换」静默失败 + 假成功**：`replaceSelectedWith` 原用 `markdownText.indexOf(sel)` 字符串手术定位选区，跨块时序列化不一致频繁返回 `-1` 不替换；调用方仍弹「已扩写」成功。改用 Milkdown 官方 `replaceRange(markdown, {from,to})` 文档级区间替换；`aiExpand/aiRewrite/aiTranslate` 检查返回值，失败时弹错误 toast。
- **「跟随系统」外壳恒为深色**：`variables.css` 把 `system` 与 `dark` 共用深色变量，使 OS=浅色时外壳深色、编辑区白底，明暗割裂且未真正跟随系统。现 `system` 在 JS 端 `resolveMode` 解析为 `light/dark` 写进 `data-theme`，清理 8 处 `:root[data-theme="system"]` 选择器，外壳真正跟随系统。

### 2. 打磨项（Changed / Polished）
- **callAI `timedOut` 恒 false**：改为 getter，超时后实时反映真实状态（旧写法按值捕获，定时器改写的是闭包局部变量）。
- **Onboarding 文案**：步骤 2「点击左侧『样式』」→「点击左侧『外观』」（工具栏已改名）。
- **resize 拖拽监听器泄漏**：组件卸载瞬间若仍在拖拽，`document` 级 `pointermove/pointerup` 监听未移除，已在 `onUnmounted` 兜底清理。
- **品牌字体「清除」入口**：外观面板正文字体新增「清除」按钮，与品牌主色清除对称（底层 `useBrand.clearBrandFont` 已就绪，仅缺 UI 接线）。
- **ThemeModeSwitch 键盘可达性**：已有 `role="radiogroup"`，补 roving tabindex + 方向键移动（radiogroup 规范）。
- **stripBareDirectives 误删边界**：种子块中和正则原为 `(cover|divider|quote)` 全匹配，收窄为仅 `cover`（默认种子块只可能是 cover 类型），避免误删用户真实内容中「恰好是『点击编辑文字』」的 divider/quote 装饰块。

### 3. 测试
- 新增回归用例：编辑器 `letter-spacing` 不再出现双 `px`；`system` 模式外壳明暗与编辑区一致；AI 选中替换（空选区返回 false、跨块保留标题、单行替换成功）；`stripBareDirectives` 边界（divider/quote 保留、cover 种子中和）；`callAI.timedOut` 超时后实时为 true。
- `vitest` 全绿（61 → 65），`vite build` 通过。

---

## [2026-07-21] UX 架构重设计落地 · 响应式 + 交互一致性（v0.14.0）

> 📱 全量落地 UX 架构重设计 12 个断点（B1–B12）+ 响应式根基打磨：平板编辑器最小宽达标 480px、转化闭环（发布向导 / 入口协调）、外观三态与样式统一、AI 前置说明与导入去向，组件化收尾并补齐暗色对比度。纯前端、无后端、内容不出本机。

### 1. 响应式根基打磨（Changed）
- `.app-root` 改用 `100dvh`，规避移动端地址栏导致的高度跳动
- `≤768px` 左侧工具栏改为横向滚动单行，按钮 `min-height:44px` 触屏可达；分组由纵向堆叠改为横向平铺，修复底栏被撑到 ~160px 高的 bug
- `.main-content` 加 `padding-bottom:56px` 防工具栏遮挡编辑区
- Onboarding 卡片加 `max-height:90dvh + overflow-y:auto`，小屏可滚动
- 新增手机横屏（`orientation:landscape`）媒体查询适配

### 2. 平板编辑器最小宽达标（Fixed, B8）
- **问题**：重设计规范要求平板编辑器可视宽度 ≥480px，初版仅设 `min-width:260px`，iPad 810px 宽开面板时编辑器可见区仅 ≈458px
- **修复**：`@media (max-width:1024px)` 块改写——面板改为 `position:fixed` 纯覆盖（`.main-content.panel-open` 由推挤 `margin-left:280px` 改为 `margin-left:0`）；面板打开时 `.preview-section{display:none}` 避免争宽；关闭时预览退为窄侧栏 `26vw max 210px`；`.editor-section min-width` 260px→**480px**
- 验证：≥1024px 完全达标；769–1023px 编辑器盒宽 ≥480px 不溢出

### 3. 转化闭环（New, B4/B9/B12 · M1）
- **B4 发布向导**：复制 HTML 成功后常驻轻引导卡片（✓已复制 + 一键「打开微信后台」+ 粘贴自检清单），不再一闪而过；发布工具栏新增「微信」按钮把 `openWeChat` 提至主发布流
- **B9 入口协调**：`onMounted` 加 `!showRecoveryBanner` 守卫（恢复横幅优先于 Onboarding）；`finishOnboarding` 去掉 `loadSampleArticle()`（不再静默覆盖用户草稿）；空状态保留「载入示例文章」按钮（用户主动触发）
- **B12 复制告警收紧**：base64 告警改为条件化，仅当 HTML 含 `data:` URI 时才提示需在微信素材库上传，普通文本不再误报

### 4. 一致性收敛（Changed, B1/B2/B3/B5 · M2）
- **B5 样式统一**：合并「样式」+「设置-品牌」为单一「外观」面板 `AppearancePanel.vue`，显式三层叠（主题 → 品牌色 → 逐元素微调）+ 级联说明；手机型号作为独立「预览设备」组；工具栏「样式」→「外观」、移除「设置」项
- **B2 微信深色归位**：从发布组移除，移入 `PreviewPanel` 头部按钮（标注「仅预览」，v-model 双向绑定，不影响复制/导出）
- **B3 外观三态**：`cycleThemeMode` 循环切换改为纵向 `radiogroup` 三态（浅色 / 深色 / 跟随系统，`aria-checked` 一步直达），含移动端横排 + 横屏 40px 紧凑布局
- **B1 装饰解耦**：工具栏装饰项 title/aria 统一为「装饰元素」；面板删除「800×400 / 800×40」图片尺寸文案（纯装饰语义），移除 `image-notice` 图片提示块

### 5. 打磨与架构基座（Changed/Fixed, B6/B7/B10/B11 · M3）
- **B6 上下文栏一致性**：`updateSelectionType` 去掉「≥10字」限制，短文也能进入 text 分支显示格式化操作（不再空白死路）；图片节点（NodeSelection）不显示空栏；新增 Milkdown `toggleStrong/toggleEmphasis/toggleLink` 命令封装 `formatBold/formatItalic/formatLink`
- **B7 导入去向**：`importFromText` 提纯后自动关闭面板、滚动编辑器顶部、`toast('已导入 N 字')`，导入反馈清晰
- **B11 AI 前置说明**：`AIPanel.vue` 顶部新增可关闭 `.ai-intro-notice` 块（说明需自备 Key + 仅本地直连厂商），`localStorage(podcast_ai_intro_seen)` 记忆已读；App.vue 加 `aiIntroSeen/dismissAiIntro` 状态 + prop/emit
- **B10 组件化收尾**：新建 `PublishWizard.vue`（发布引导卡片）+ `ThemeModeSwitch.vue`（三态控件，含 `:focus-visible` 焦点环）；删除孤儿组件 `StylePanel.vue`/`SettingsPanel.vue`；`src/styles/variables.css` 补 `--accent` 语义变量，深色 `--text-tertiary` 提亮 `#888698→#9b99ab`（3.82→4.87:1 达 WCAG AA）、深色 `--accent` 提亮 `#9b8cff`，并修深色下 `.ai-intro-dismiss` 文字色（亮紫背景白字 2.77→深色文字 6.16:1）

### 6. 测试与质量（Test）
- 全量 **52 vitest 通过**（含既有 Enter / 序列化 / 装饰 REGRESSION 用例），`vite build` 零错误
- 暗色对比度审计达 AA（正文 / 次要文字 / 强调色全量核对）

### 7. 已知诚实备注（不达标项留痕）
- **B10「App.vue 行数明显下降」未严格达成**：因新增发布向导 / 外观三态等功能，App.vue 由 v0.13.3 ~2800 行净增至 **3457 行**；但组件化目标（拆出 AppearancePanel/PublishWizard/ThemeModeSwitch，删除 StylePanel/SettingsPanel 孤儿）已达成
- **B10 tokens.css 基座**：原计划新建 `tokens.css`，实际增强既有 `src/styles/variables.css`（补齐 `--accent` 等语义变量），未另立文件
- **EntryCoordinator 未单独拆分**：Onboarding + 恢复横幅的入口协调逻辑仍保留在 App.vue，未抽为独立协调器

---

## [2026-07-20] 深色模式根治 + 微信深色预览模拟（v0.13.3）

> 🌙 修复「开深色模式后编辑器背景变暗、但文字/主题色没跟着变」导致正文与强调色看不见的顽疾；新增「微信深色」预览开关，发布前自查读者深色端观感。

### 1. 编辑器深色模式（背景与文字一同切换）
**根因**：原 `editorThemeCss` 只把 `.milkdown .ProseMirror` 的 `body` 底色强行换成深色（`App.vue` 原 840-848 行），但 h1/p/li 等元素的颜色是主题内联样式定义的、没跟着换，于是深底下主题强调色（如 `#8b0000` 深红）几乎不可见。
**修复**：新增 `src/darkTheme.js`，`deriveDarkTheme(theme)` 用 HSL 颜色变换把整主题派生为暗色版——背景转暗、正文/强调色提亮（轻微降饱和以提升深底可读性）。深色模式下 `editorThemeCss` 改用派生主题（浅色模式仍强制白底，不变）。验证：深色模式下编辑器 h1=`#f89696`、正文=`#d4d4d4`，深底下清晰可读。

### 2. 预览「模拟微信深色模式」开关
**背景**：查微信官方文档 + 135/365/壹伴实测 —— 读者手机开深色模式时，微信**自动反色**：无彩色（黑白灰）按算法反转（背景≈`RGB(36,36,36)`、文字转浅），但**有彩色（主题强调色）原样保留、不反转**；文章内不支持 `prefers-color-scheme`、不支持 `<style>`、过滤 `!important`，故导出 HTML 无法自行跟随读者深色模式。结论：导出始终浅色（交给微信算法），预览增加模拟开关。
**修复**：`buildHtml` 增加 `options.wechatDark`，为 true 时用 `deriveWeChatDarkTheme(theme)`（背景压暗、无彩色文字反白、**彩色强调色保留**——如实暴露微信不反转彩色的低对比风险）。工具栏新增「微信深色」开关，仅影响预览、不影响复制/导出（导出恒浅色）。验证：开关开后预览背景 `#252522`、正文浅灰、h1 仍为 `#8b0000`（彩色保留）；开关关回白底。

### 3. 关键实现细节
- 颜色变换统一在 `src/darkTheme.js`：`parseColor`/`rgbToHsl`/`hslToRgb` + `mapColorsInStyle`（按 `color`/`background`/`border` 属性分别变换）+ 两套派生函数共用。
- HSL 饱和度坑：近白浅色表面（暖白 `#f9f7f1`、淡粉白 `#fff5f5`）在 HSL 下饱和度极高，直接压暗会变成深红/深蓝怪色；故背景 `L>0.8` 时压成中性深灰（`L≈0.14`）。
- `editorThemeCss` 与 `buildHtml` 内主题变量原均为 `const t`，派生需重新赋值 → 改为 `let t`（否则运行时 `Assignment to constant` 导致编辑器不挂载）。

## [2026-07-20] 装饰块与 Enter 幽灵封面根治（v0.13.2）

> 🐛 修复「按 Enter 在编辑器内冒出封面卡片」的顽疾；修复装饰语法 `::: cover` 在编辑器内完全不渲染。

### 1. Enter 凭空插入封面卡片（Bug A 根治）

**根因（确凿）**：装饰节点 `cover/divider/quote` 为让 `:::` 容器语法被解析，必须注册在 `commonmark` 之前，于是它们成为 schema 中排在最前的 textblock。ProseMirror `splitBlock` 用 `defaultBlockAt()` 取「第一个无必需属性的 textblock」作为 Enter 拆分出的新块类型，结果取到了 `cover`。于是在普通段落末尾按 Enter，会插入一个空 `cover` 节点（渲染成幽灵封面卡片）；序列化后又被 `stripBareDirectives` 清除，所以刷新/预览后消失——与用户描述「编辑器里是卡片、预览是正文、刷新变回正文」完全吻合。

**修复**：新增 `src/plugins/forceParagraphEnter.js`（`$prose` handleKeyDown 插件），在普通文本块按 Enter（无 Shift/Cmd、非标题/代码块/列表）时，强制以 `paragraph` 作为 split 产生的新块类型，绕开 `defaultBlockAt` 误判。插件注册在 `headingEnterFix` 之前，确保普通段落 Enter 优先被拦截。刻意保留 `docDefaultType=cover`（不改动 schema 顺序与 attrs），以避免破坏 `:::` 解析。已用 puppeteer 真实浏览器复现验证：普通段落 Enter 后 doc 变为 `[heading,paragraph,paragraph,...]`、`covers=0`；标题 Enter→paragraph、列表 Enter、Shift+Enter 软换行、封面卡内 Enter 均不受影响。

### 2. 装饰语法 `::: cover` 编辑器内不渲染（Bug B 根治）

**根因**：`remark-directive` 3.x 的容器指令语法是 `:::name`（`:::` 后**无空格**紧跟类型名）。本项目一直写成 `::: cover`（带空格），被 remark-directive 当成普通文本，于是 `:::` 在编辑器里从未被解析成卡片节点（预览却因 `buildHtml.js` 用独立正则能渲染，造成「编辑器中立文字、预览正常」的不一致）。此 bug 此前潜伏，因为唯一的封面卡片来源是上面的 Enter 幽灵块。

**修复（全链路统一为 `:::cover` 无空格规范语法）**：
- `insertDecorBlock` 插入 `:::cover` / `:::divider` / `:::quote`（`::: ` + type → `:::` + type）
- `buildHtml.js` 预览正则改为 `::: ?(\w+)` 同时兼容新旧 `:::cover` / `::: cover`
- `stripBareDirectives` 裸 `:::` 检测修正：原正则只认 `::: 类型`（带空格）为合法开标签，会把无空格的 `:::cover` 误判成裸 `:::` 删掉；改为 `:::(?:[ \t]+)?(\w+)?` 正确识别两种写法
- `createDirectiveNode` 的 `parseMarkdown.runner` 修复文本收集：容器指令的子节点是块级节点（paragraph），标题文字在其 `children[].value` 或更深层的 `children` 里，原代码只取顶层 `c.value` 会丢失文字；改为递归收集，封面/金句标题不再丢失

验证：加载 `:::cover/:::divider/:::quote` 草稿，编辑器内正确渲染 1 封面 + 1 分割线 + 1 金句卡片；内容上屏（如「封面标题」「金句内容」）正确显示。

## [2026-07-20] Bug 修复 + 图片功能移除（v0.13.1）

> 🔧 代码审查修复、图片操作 Bug 根治、图片功能移除、样式面板修复、金句卡片修复。

### 1. 代码审查 Bug 修复（Fixed）

- 三处 `nextTick` 缺 `isSettingEditor`：`insertImage` / `updateImageWidth` / `setHeadingLevel`，修复 history 栈污染和预览不同步
- 图片宽度调整变乱码 Bug 根治：`replaceImageInMarkdown` 不再转 HTML `<img>`，宽度信息分离到 `imageWidthMap`，由 `buildHtml` 消费
- 上下文工具栏图片操作失效：`editorViewCtx.key` → `editorViewCtx`
- 装饰块插入显示为原始 `:::` 文本：改用 `setEditorMarkdown` 重解析路径
- Ctrl+S 缺 `saveDraftNow` 调用
- `useBrand.applyBrand()` 签名错误
- 大 data URI 正则性能优化
- AI 选中替换位置不准
- `isDarkMode` 系统主题响应
- 编辑器嵌套列表样式补充
- CSS 重复定义清理
- `nestedList` 主题去重
- 空状态深色模式字色
- 样式滑杆 `@change → @input` 回退 + 移除重做工具栏按钮
- Ctrl+S toast 文案改进

### 2. 图片功能移除（Removed）

- 删除 18 个图片函数 + 3 块 UI + 11 个 ref
- 原图片上传区替换为 Markdown 语法提示
- 删除 paste/click 图片事件 handler
- 上下文工具栏图片行删除
- 选区轮询中 image 分支删除
- `buildHtml` Post-process C 保留为可选（不影响）

### 3. 金句卡片修复（Fixed）

- `markdownUpdated` 增加 `\:::` 转义还原，修复 remark-directive 序列化后预览乱码

### 4. 测试增强（Test）

- 新增：blockquote/li/del/h2/h3/mark 主题数据测试、30s 超时测试
- 总测试数：26 → 31（+5）

### 5. 标题 Enter 行为修正（Fixed → 已修正崩溃）

> ⚠️ 初版实现存在致命 bug，本次重新定位根因并修复。

**根因（崩溃）**：`src/plugins/headingEnterFix.js` 在标题末尾按 Enter 时调用 `$head.after($head.depth - 1)`。
顶层标题的 `$head.depth === 1`，`after(0)` 试图取「文档根节点之后」的位置——该位置不存在，
ProseMirror 直接抛 `RangeError: There is no position after the top-level node`。

由于该插件以 `handleKeyDown` prop 形式注册，抛异常会中断整条 keydown 处理链：
标题末尾 Enter 既不创建段落、也不走默认 splitBlock（连「继承 H1」的默认行为都丢了），
表现就是「标题后按 Enter 没反应 / 卡在标题里 / 后续 Enter 行为异常」。
用户感知的「正常段落按 Enter 还是 H1」实为：离开标题的 Enter 崩溃了，用户始终还停留在标题节点内，
后续在「以为是正文」的标题里按 Enter 命中了标题继承，于是不断冒出 H1。

**修复**：改为 `$head.after($head.depth)`（取标题节点自身之后，对任意层级均合法）。
- 标题（H1/H2/H3）末尾按 Enter：创建普通段落（已验证，不再崩溃）
- 标题中间按 Enter：仍拆成两个同级标题（默认 splitBlock）
- 列表/引用/代码块/正文的 Enter：完全不受影响（插件对 paragraph 直接 `return false`）
- 复现/回归测试：`tests/appSync.test.js`（完整复刻 App.vue 的 markdown 双向同步回路 + directive 节点 + headingEnterFix，4 项 Enter 行为全部通过）

### 6. 装饰节点序列化崩溃修复（Fixed）

> 🐞 用户实测：插入**金句卡片 / 封面卡片**后预览出现重复「欢迎使用 净排」、装饰元素错位、占位文本 `点击编辑文字` 变成多余标题、控制台报 `b.addText is not a function`。

**根因**：`src/App.vue` 的 `createDirectiveNode` 中，`toMarkdown` runner 错误地调用了 `state.addText(...)`。
Milkdown 有两套状态：
- **解析器状态（ParserStack）** 有 `addText` —— `parseMarkdown` 侧用它是对的；
- **序列化器状态（SerializerStack）** 只有 `openNode / closeNode / addNode / next`，**没有 `addText`**。

`toMarkdown` 跑在序列化器上，于是插入 `quote`/`cover`（它们走 `type !== 'divider'` 分支、会调用 `addText`）时直接抛
`TypeError: b.addText is not a function`，整个文档序列化中断、状态被打乱，引发上述一连串渲染异常。
（分割线 `divider` 因走跳过分支、序列化不崩，但仍被整体崩溃波及。）

**修复**：序列化器里加文本改用 `state.next(node.content)`（递归交由文本节点自行序列化，
与 Milkdown `preset-commonmark` 的 paragraph `toMarkdown` 写法一致），删除错误的 `state.addText` 调用。

- 回归测试：`tests/bugReproduce.test.js` 新增 `REGRESSION: 金句卡片(quote)` 与 `REGRESSION: 封面卡片(cover)` 两项，断言序列化不抛错且 `::: quote`/`::: cover` 正确往返
- 全测试套件 10/10 通过，`vite build` 零错误

### 7. 段落 Enter 产生「幽灵装饰块」修复（Fixed → Bug A 根治）

> 🐞 用户实测：正常正文段落末尾按 Enter，新行变成「分割线 / 封面卡片」格式（视觉上像分割线，实为封面卡片——上下边线 + 居中空文字）。

**根因（空段落序列化串台）**：段落末尾按 Enter，`splitBlock` 创建的是**空段落**（正常且正确，光标停在其中）。
但 Milkdown 的 markdown 序列化器（remark-stringify）有个怪癖：**空段落会被序列化成「裸 `:::`」**（无类型名的空容器指令 `:::` … `:::`）。
这段含裸 `:::` 的 markdown 进入预览 / 重解析后，被当成装饰节点处理，渲染出封面卡片样式的幽灵块。
隔离测试证明：**纯文档（完全无装饰节点）按 Enter 同样冒出裸 `:::`**，与装饰实现无关，纯属空段落序列化格式问题。

**为什么看着像封面卡片而非分割线**：裸 `:::` 在重解析后映射到的装饰节点渲染为「上下边线 + 居中 h1（空文字）」，恰好是封面卡片的视觉（上边线 + 字 + 下边线），所以用户先以为是分割线、后确认是封面卡片。

**修复**：在序列化出口处精准剔除裸 `:::` artifact。裸 `:::` 不合法（合法装饰必带 `cover/divider/quote` 类型名），
新增导出函数 `stripBareDirectives(md)`（`src/buildHtml.js`），用**栈式解析**区分：
- 带类型名的 `::: type` → 合法开标签，入栈
- 裸 `:::` 且与栈内开标签配对 → 合法闭合，保留
- 栈为空时的孤立裸 `:::` → artifact 开标签，删除本行并连同其配对的下一个裸 `:::` 一并删除

> ⚠️ 初版尝试用 `md.replace(/^[ \t]*:::[ \t]*$/gm, '')` 逐行删裸 `:::`，会**误伤合法装饰的闭合定界符**（装饰闭合也是裸 `:::` 行），导致装饰块丢失，已废弃改用栈式。

- 调用点 1：`src/App.vue` 的 `markdownUpdated` 监听器（编辑器→markdownText 唯一出口，含转义还原 + 剔除）
- 调用点 2：`src/buildHtml.js` 的 `buildHtml` 预处理（覆盖导入 / AI / 直接调用等所有入口，防御性）
- 回归测试：`tests/serialize-test.test.js` 新增 3 项（观察 cover/divider/quote 序列化形态、Enter 后不应多出封面、纯文档 Enter 隔离），全测试套件 13/13 通过

### 8. 已知限制

- 删除图片后 Ctrl+Z 不可恢复（`replaceAll` 清空 history 栈的固有代价）

---

## [2026-07-18] 用户体验架构重构（v0.13.0）

> 📐 全链路 UX 架构重设计：工具栏任务流重组、新手 Onboarding、上下文工具栏、状态栏增强、模块拆分、AI 场景化推荐、Bug 修复。

> **来源**：`docs/PRD/用户体验架构重构.md` + `docs/design/UX架构实施计划.md` + `docs/design/ADR-图片操作管线修复.md` + `docs/design/Review-2026-07-18.md`

### 1. 工具栏任务流重组（Changed）

- 左侧工具栏从「按实现顺序排列」重排为 5 个任务区：
  - 写作区：撤销 · 重做 · 导入
  - 排版区：样式 · 装饰/图片
  - 增强区：AI 写作
  - 发布区：预览 · 复制 · 导出
  - 系统区：清除样式 · 设置 · 外观
- 每个任务区有 `.toolbar-group-label` 小标签，组间用 1px 分隔线

### 2. 新手 Onboarding 四步引导（New）

- 首次使用弹出引导浮层：写作 → 主题 → 发布 → 功能标签云
- 完成后自动载入示例文章；跳过标记 `podcast_settings.onboardingDone`

### 3. 顶部上下文工具栏（New）

- 编辑器上方 `.context-bar`，根据选区动态显示操作：
  - **图片**：宽度拖杆 · 替换 · 删除（通过已有 `editingImage` 体系驱动）
  - **标题**：H1/H2/H3 快速设置
  - **文字(≥10字)**：⚡扩写 · 🔄改写 · 🌐翻译
- 新增 `aiRewrite`、`aiTranslate`、`runAiAction` 函数

### 4. 底部状态栏增强（Changed）

- 新增字数统计、预估阅读时长、AI 写作中 spinner
- 新增 `wordCount`、`readTime` computed

### 5. 模块拆分（Refactor）

- **composables**：`useDraft.js`（草稿）、`useBrand.js`（品牌色）、`useStyle.js`（样式逻辑）
- **components**：`PreviewPanel.vue`、`AIPanel.vue`、`StylePanel.vue`、`ExportPanel.vue`、`SettingsPanel.vue`
- App.vue：4022 → 3717 行（净减 305 行）

### 6. AI 面板场景化推荐（Changed）

- 4 个平铺按钮 → 智能推荐（无内容→标题、长文→摘要+结构化、短文→扩写+结构化）
- 其余操作折叠在「更多操作」中，由 `aiRecommendations` computed 驱动

### 7. 面板上下文保持（Changed）

- 6 个浮动面板 `v-if` → `v-show`，切换时 DOM 不销毁、状态不丢失

### 8. 图片插入管线修复（Fixed）

- `insertImage`：`insertText("![alt](url)")` → `replaceSelectionWith(imageNode)`
  - 根因：`insertText` 不触发 Milkdown Markdown 解析器，base64 data URL 显示为乱码

### 9. 上下文工具栏图片删除修复（Fixed）

- 委托给已有 `deleteEditingImage()` / `replaceEditingImage()`（Markdown 文本路径，已验证可用）
- 图片点击检测由 `onImageClick`（DOM click event）驱动，不再依赖 ProseMirror 选区轮询

### 10. 代码审查 Bug 修复（Fixed）

- `getEditorView`/`setHeadingLevel`/选区轮询：`editorViewCtx.key` → `editorViewCtx`（修复上下文工具栏图片操作失效）
- `insertDecorBlock`：`insertText('::: ...')` → `setEditorMarkdown()` 重解析路径（修复装饰块插入后显示为原始文本）
- CSS 重复定义清理：`.preview-btn.active` 定义 3 遍含语法破损 → 整段删除
- Ctrl+S 快捷键：新增 `saveDraftNow()` 调用（之前只保存设置不保存草稿）
- `useBrand.applyBrand()` 签名修复：`applyBrandToTheme(branded, '#fff', 'serif')` → `applyBrandToTheme(branded, { color: ..., font: ... })`
- 大 data URI 正则性能：超过 2000 字符的 data URI 跳过精确匹配，直接模糊匹配
- AI 选中替换：新增 `getSelectedMarkdown()` + `replaceSelectedWith()` 基于 ProseMirror serializer 的精确替换
- `isDarkMode` 系统主题响应：新增 `systemDark` ref + matchMedia change 监听器
- `useDraft` JSDoc：补充 setup() 期间调用的使用约束
- 编辑器嵌套列表样式补充
- `router` 死 import 删除（`@milkdown/plugin-history` 无此导出）
- `getEditorMarkdownOffset` 光标偏移：`lastIndexOf` → ProseMirror `selection.from` 直接取值
- `buildHtml` XSS 防护：导入 DOMPurify，新增 `options.sanitize` 参数
- 30s 超时测试：用 `vi.advanceTimersByTimeAsync(30000)` 替代 30s 真实等待
- AI 标题 prompt 加固：加"不要引号"约束，strip 规则覆盖引号
- `useStyle.getDefaultStyle`：硬编码颜色/字号 → 从 `THEMES.serif_news` 动态解析
- `nestedList` 去重：删除 `mellow_pink` 显式定义，统一用 `DEFAULT_NESTED_LIST`
- 空状态字色：`.phone-content` 硬编码 `#3e3e3e` → CSS 变量
- 样式滑杆性能：`@input` 分离为值更新 + `@change` 触发重算
- 主题下拉 blur：`@blur` → `@focusout`（冒泡版本，更可靠）

### 11. 图片操作 Bug 专项修复（Fixed）

- **Bug #1（宽度调整变乱码）**：`replaceImageInMarkdown` 不再转 HTML `<img>`，宽度改存 `imageWidthMap`（src → width 映射表），由 `buildHtml` 在生成预览/导出时消费
  - `updateImageWidth`：放弃 ProseMirror `setNodeMarkup` 路径，改为直接更新 `imageWidthMap` + 刷新预览
  - `commitImageEdit`：统一走 `imageWidthMap`，不再输出 HTML `<img>`
  - `deleteEditingImage`：删除图片时同步清理 `imageWidthMap`
  - `renderHtml`：传递 `imageWidthMap` 给 `buildHtml`
  - `buildHtml` Post-process C：从 `imageWidthMap` 注入 `<img width>`
- **Bug #2（Ctrl+Z 撤销不工作）**：`insertImage` 的 `nextTick` 回调加 `isSettingEditor` 围栏，阻止 sync watcher 执行 `replaceAll` 覆盖 history 栈
- **Bug #3（`updateImageWidth` 不同步）**：同上 `isSettingEditor` 围栏修复
- **Bug #4（`setHeadingLevel` 预览不更新）**：新增 `nextTick` + `isSettingEditor` 同步 `markdownText`
- **拖拽区边框闪烁**：`onDragLeave` 增加 `currentTarget.contains(relatedTarget)` 检查

### 12. 测试增强（Test）

- `callAI.test.js`：新增 30s 超时测试（+1）
- `buildHtml.test.js`：新增 blockquote/li/del/h2/h3 + mark 主题数据测试（+4）
- 总测试数：26 → 31（+5）

---

## [2026-07-18] 组件拆分（v0.13.1）

> 📦 面板组件化 + composable 提取，App.vue 净减 305 行。

### 模块拆分（Refactor）
- **composables**：`useDraft.js`（草稿）、`useBrand.js`（品牌色）、`useStyle.js`（样式逻辑）
- **components**：`PreviewPanel.vue`、`AIPanel.vue`、`StylePanel.vue`、`ExportPanel.vue`、`SettingsPanel.vue`
- App.vue：4022 → 3717 行

---

## [2026-07-17] UI 体验优化 + 本地图片 + 图片编辑（v0.12.0）

> 🎨 UI 细节大迭代：深色模式编辑器变暗、空状态引导增强、本地图片上传（文件选择/拖拽/粘贴）、图片点击编辑（alt/宽度/替换/删除）。

### 1. 深色模式：编辑器区域随模式变暗（Changed）

- **编辑器也变暗**：之前深色只作用于外壳（工具栏/面板），编辑器始终白底。现根据 `isDarkMode` 计算属性，深色模式下编辑器用 `#1e1e1e` 暗底 + `#d4d4d4` 浅色文字，与外壳融为一体。
- 预览区 `.phone-content` 显式 `background: #ffffff` 钉死白底，深色外壳不穿透。
- `.ProseMirror` 深色模式文字色适配。

### 2. 深色模式全量 token 审计（Fixed）

- 扫描全部 CSS 硬编码颜色，修复 6 处残留：
  - `.phone-wechat-bar` 微信模拟顶栏：深色模式改用 `#3c3c3c` 暗底
  - `.wechat-title` 文字色深色适配
  - WeChat 图标 SVG `stroke` 深色模式适配
  - `.phone-frame` 深色模式阴影增强
  - `color: var(--text-secondary, ...)` 等 fallback 值保持

### 3. 空状态首屏引导增强（New）

- 空状态从「✍️ 在左侧写点什么」升级为完整引导：
  - "开始创作你的公众号文章" 标题
  - 功能标签云：🎨 10 套主题 / 🖼️ 装饰元素 / 🤖 AI 辅助 / 🔒 纯本地
  - **「载入示例文章」** 按钮，一键调用 `loadSampleArticle` 填充 `DEFAULT_CONTENT`
- 优化空状态排版间距、图标大小、按钮样式。

### 4. 复制/跳转微信引导文案增强（Changed）

- 复制成功 toast：「去微信后台粘贴 → 封面/分割线/金句自动生效，图片需在微信素材库上传」
- 打开微信后台 toast 同步增强，提示装饰/图片表现。

### 5. 本地图片上传（New）

- **装饰面板**新增 3 种本地图片源入口：
  - 📁 **文件选择器**：点「选择本地图片」按钮弹出文件选择框
  - 🎯 **拖拽放置区**：虚线框区域，支持 JPG/PNG/GIF/WebP
  - 📋 **剪贴板粘贴**：编辑器内 Ctrl+V 自动捕获剪贴板的图片
- 图片用 `FileReader.readAsDataURL()` 转为 base64，插入 Milkdown 编辑器
- 大小限制 10MB，类型校验
- 复制时 toast 提示需在微信素材库上传

### 6. 图片插入后闭环操作（New）

- **图片点击选中**：点击 ProseMirror 编辑区内的图片 → 蓝色选中框 → 弹出「图片编辑」面板
- **替代文本编辑**：修改 `![alt]` 中的 alt 文字
- **显示宽度调整**：滑块 10%~100%，点击「应用」写入 `<img width="...">`
- **替换图片**：选新文件替换当前图片
- **删除图片**：一键从 Markdown 源移除
- 图片匹配算法支持超长 data:URI 模糊匹配（取末尾 50 字符特征）
- 分步提交模式（滑块不触发全文替换），避免编辑抖动

### 7. Bug 修复（Fixed）

- 重复插入图片（拖拽/文件选择器）时避免重复触发
- 移动端工具栏覆盖编辑区 → 改用 `.mobile-toolbar` 底部横向布局
- Paste 事件防循环：设置 `isSettingEditor` 标志避免 `markdownUpdated` 监听器回写
- 装饰块首屏稳定性（`milkdown-decor-*` 卡片渲染率 100%）
- 分隔线拖拽改 Pointer Events（触屏可用+防止页面滚动）

### 8. Bug A「按 Enter 编辑器冒出封面卡片」—— 纠正与最终根治（Fixed）

> ⚠️ 本节取代此前对 Bug A 的所有错误归因（包括「isFromEditor guard 阻断同步」与「AST 插件降级裸 :::」两条错误路径）。
> 真实根因由浏览器 `[DIAG]` 诊断日志坐实。

- **现象**（用户实测）：正文段落按 Enter，编辑器内显示为封面卡片样式，但预览区是干净正文；**刷新页面后封面卡片消失变回正文**。
- **真实根因（种子链，经 Node 探针确认 misparse 为浏览器特有行为）**：
  1. **种子来源** = `insertDecorBlock()` 插入的 `\n::: cover\n点击编辑文字\n:::\n`，其中「点击编辑文字」是占位文字块。
  2. 文档里再出现一个**裸 `:::`**（浏览器 remark-directive 对空段落/容器的序列化怪癖），二者相邻会被
     **misparse 成真 `cover` 节点**；该节点序列化后又产出裸 `:::`，形成**自我循环**，编辑器不断冒封面卡片。
  3. 诊断日志 `editorDoc` 出现 `"cover":"111"` 即此——`111` 是用户打字内容被误吸进 cover 节点。
  4. `stripBareDirectives()` 只删裸 `:::`，但把 `::: cover\n点击编辑文字\n:::` 当成**合法装饰放行**（命名开标签+裸闭合配对），
     故种子块原样进入解析器 → misparse。刷新后草稿被重新保存成「能被中和」格式 + DEFAULT_CONTENT 无种子 → 正常。
- **已推翻的错误路径**（留痕，避免重复踩坑）：
  - ❌ 「isFromEditor guard 阻断同步回路」——日志显示 syncWatch 实际执行了 replaceAll，且 Node 测试证明 Enter 只产生空段落、无 decor 节点。
  - ❌ 「AST 插件 `stripBareDirectiveRemark` 降级裸 :::」——AST 插件在解析**之后**运行，误判已在解析阶段发生，拦不住。
- **最终修复（三处协同，从种子源头切断）**：
  1. **`insertDecorBlock()` 改为插入空封面/金句**：`\n::: cover\n\n:::\n`（不含占位文字），序列化即 `::: cover\n\n:::`、无任何内部文本，**不再产生 misparse 种子**。占位提示「点击编辑文字」改由 CSS `.milkdown-decor-cover h1:empty::before` / `.milkdown-decor-quote:empty::before` 渲染。
  2. **`stripBareDirectives()` 中和种子块**：在栈式剔除前新增预处理，把 `::: (cover|divider|quote)\n点击编辑文字\n:::`（含转义变体)整体删除。该函数被**四个解析入口共用**（defaultValueCtx / 首屏 replaceAll / 同步 watch / setEditorMarkdown），加载/首屏/同步/插入全中和。
  3. **删除无效插件** `src/plugins/stripBareDirectiveRemark.js`（AST 阶段运行，无法阻止解析期 misparse），并移除 `App.vue` 的 import 与 `.use()` 注册。`normalizeStaleWelcome(md)` 简化为直接复用 `stripBareDirectives(md)`。
- **测试**：全量 **51/51 通过**（`tests/editor-parse-entry.test.js` 锁定「种子块被中和 / 裸 ::: 进解析器前消失 / 真实内容封面保留」；`tests/serialize-test.test.js` 改用真实内容封面以匹配新行为）。

