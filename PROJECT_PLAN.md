PodcastPublish —— 播客精华公众号排版工具 · 开发计划书
项目定位：为轻量化内容创作者打造的一站式公众号排版工具，解决“写完内容后还要花大量时间排版配图”的痛点。

一、项目背景与目标
1.1 现状与痛点
现有方案：一个 GitHub 开源自动化脚本，需手动将 .md 文件放入指定文件夹，通过命令行（Trae）执行。

核心痛点：

无前端界面，操作不直观（没有“产品感”）

排版层级有限（仅支持基础 H1/H2/P）

字体/样式无法独立调整

配图流程繁琐（依赖付费 Claude API）

1.2 产品目标
打造一个 Web 端可视化排版工具，创作者只需在浏览器中编写/粘贴 Markdown，即可：

实时预览公众号排版效果

自由切换/自定义风格主题

一键复制带内联样式的 HTML 到公众号后台

快速获取免费、合规的配图推荐

1.3 最终交付物
一个完整的、可本地运行的 Web 应用 Demo

完整的项目源码（含 README、部署文档）

可用于求职作品集展示

二、目标用户画像
身份：个人公众号运营者 / 内容创作者

场景：每周产出 1~2 篇播客精华总结文章

核心诉求：把时间花在选题和内容撰写上，排版配图越省心越好

技术背景：非专业开发者，期望“打开即用”

三、技术栈选型
模块	技术选型	选型理由
前端框架	Vue 3 + Vite	上手快、生态成熟，适合个人开发者快速构建
UI 组件	Element Plus / Naive UI（可选）	提供规范的按钮、表单、弹窗等组件，提升开发效率
Markdown 编辑	md-editor-v3（Vue 3 版本）	开箱即用的 MD 编辑器，支持拖拽、实时预览
解析引擎	markdown-it	插件生态丰富，性能优于同类库，易于自定义渲染
后端框架	Python Flask	极简轻量，适合承载静态页面和少量 API（如配图代理）
样式方案	原生 CSS + CSS 变量	灵活生成公众号兼容的内联样式
配图服务	Unsplash API（免费）	无需付费，注册即用，图片质量高且版权合规
部署方式	本地运行（localhost）为主，可选云服务器	降低门槛，后期可移植
四、分阶段开发路线图

第一阶段：搭建基础界面（让产品“看得见”）
目标：打开浏览器就能看到一个排版工具界面，不再是黑乎乎的终端。

具体任务：

使用 Vite 创建 Vue 3 项目：npm create vite@latest podcast-publish -- --template vue
安装并集成 md-editor-v3：npm install md-editor-v3
设计页面三栏布局：
顶部：应用标题、导入按钮、导出/复制按钮、风格切换下拉菜单
左侧：Markdown 编辑区（md-editor 组件）
右侧：手机样式预览区（宽度 375px，模拟微信公众号阅读界面）
实现拖拽上传 .md 文件功能（使用 HTML5 Drag & Drop API 或 md-editor 自带功能）
产出：一个可以查看、编辑 Markdown 的界面，右侧实时显示原始文本（此时尚未转换样式）。

第二阶段：核心转换引擎（实现“排版”功能）
目标：右侧预览区不再是纯文本，而是带有公众号风格的富文本。

具体任务：

安装 markdown-it：npm install markdown-it
编写 markdownToWechatHtml(markdownText, themeConfig) 函数
通过 markdown-it 的 render 方法获取原始 HTML
关键步骤：编写“内联样式注入器”
遍历 HTML 标签（h1~h6, p, blockquote, ul, ol, code, pre, img 等）
根据当前选中的主题配置，为每个标签添加 style 属性
示例：<h1 style="font-size:28px; font-weight:bold; margin:20px 0 12px;">
实现“一键复制 HTML 到剪贴板”功能：
使用 navigator.clipboard.write() 方法写入带 text/html 格式的数据
在右侧预览区用 v-html 渲染转换后的 HTML（注意 XSS 防护，可配合 DOMPurify）
产出：左侧写 # 标题，右侧立刻显示加粗大字的标题；复制粘贴到公众号后台，样式完整保留。

第三阶段：风格主题系统（支持层级扩展与独立调参）
目标：支持多套预设风格，且用户可以独立调整任意标签的字号、颜色等。

具体任务：

设计主题配置数据结构（JavaScript 对象）：
javascript
{
  id: 'podcast_green',
  name: '播客精华风',
  styles: {
    h1: { fontSize: '28px', color: '#1a1a1a', fontWeight: 'bold', margin: '20px 0 12px' },
    h2: { fontSize: '22px', color: '#07c160', fontWeight: '600', borderLeft: '4px solid #07c160', paddingLeft: '12px' },
    h3: { fontSize: '19px', color: '#333', fontWeight: '600' },
    p: { fontSize: '17px', lineHeight: '1.8', color: '#3e3e3e' },
    blockquote: { borderLeft: '4px solid #ddd', paddingLeft: '16px', color: '#888' },
    // ... 支持 h4~h6, ul, ol, code, table 等
  }
}
预设 3~5 套风格（播客风、极简风、文艺风、科技风）
在界面顶部添加“风格选择下拉菜单”
在右侧预览区或侧边栏添加“高级样式调节面板”：
下拉选择要调整的标签（如 H2）
使用滑块或数字输入框调节字号（16px ~ 36px）
颜色选择器调整颜色
修改后自动保存为“自定义主题”并存放在 localStorage 中
产出：文章层级丰富（H1~H6 全支持），字体可独立微调，风格一键切换。

第四阶段：智能配图功能（差异化亮点）
目标：根据文章内容推荐免费图片，减少找图时间。

具体任务：

注册 Unsplash 开发者账号，创建应用获取 Access Key
在界面中加入“配图推荐”按钮或侧边栏
编写前端逻辑：点击后提取文章标题或第一段文本作为关键词
调用 Unsplash Search API：https://api.unsplash.com/search/photos?query={关键词}&per_page=9
在界面底部或侧边弹出网格展示返回的图片缩略图
点击缩略图：
可设置为“文章封面”（存为变量）
或在当前光标位置插入 ![图片描述](图片链接) 到 Markdown 编辑器中
产出：写文章时点击一下，就能看到相关配图供选择，无需切到浏览器手动搜图。

第五阶段：后端集成与打包部署（完善产品闭环）
目标：不用 npm run dev 这么麻烦，双击一个脚本就能启动完整的工具。

具体任务：

构建前端静态文件：npm run build（生成 dist 目录）
新建 Flask 项目（app.py），将 dist 目录作为静态文件夹托管
Flask 提供主要路由 @app.route('/') 返回 index.html
（可选）Flask 提供代理 API，解决 Unsplash 请求跨域问题
编写启动脚本 run.py 或 start.sh，一键启动 Flask 服务
编写清晰的 README.md 文档，包含：
项目简介与截图
技术栈说明
环境要求（Node.js + Python）
详细安装与启动步骤
功能介绍
产出：一个完整的、可运行的软件包。解压后按 README 操作，即可在本地使用。

五、项目文件结构建议
text
podcast-publish/
├── backend/                  # Flask 后端
│   ├── app.py               # 主服务
│   ├── requirements.txt     # Python 依赖（flask, flask-cors 等）
│   └── static/              # 存放前端构建产物（由前端 build 生成）
├── frontend/                 # Vue 3 前端工程
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.vue   # Markdown 编辑器组件
│   │   │   ├── Preview.vue  # 公众号预览组件（含样式注入逻辑）
│   │   │   ├── Toolbar.vue  # 顶部工具栏
│   │   │   └── ThemePanel.vue # 风格调节面板
│   │   ├── themes/
│   │   │   └── index.js     # 预设主题配置
│   │   ├── utils/
│   │   │   ├── converter.js # markdown-it 转换 + 内联样式注入
│   │   │   └── clipboard.js # 复制到剪贴板工具
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
├── start.py                  # 根目录启动入口（调用 Flask）
└── README.md
六、时间规划与里程碑
建议：每天投入 2~3 小时，总计约 5 周完成。

阶段	周期	关键里程碑	验收标准
第一阶段	第 1 周（3~4 天）	界面布局 + 文件拖拽	浏览器打开能看到完整三栏布局，拖入 .md 文件能显示内容
第二阶段	第 2 周（4~5 天）	核心转换 + 复制功能	文章在预览区显示公众号风格样式，复制到公众号后台排版正常
第三阶段	第 3 周（3~4 天）	主题系统 + 独立调参	至少 3 套风格可切换，H2 字号可单独调节并保存
第四阶段	第 4 周（2~3 天）	配图推荐功能	点击按钮能弹出 Unsplash 图片列表，点击可插入图片
第五阶段	第 5 周（2~3 天）	打包集成 + README	执行 python start.py 可启动完整工具，README 可指导他人使用
七、关键技术难点与解决方案
难点	解决方案
微信公众号内联样式转换	不使用 <style> 标签，用 cheerio（Node）或原生 JS 遍历 DOM 树注入 style 属性。因为你的场景是前端转换，直接用 JS 操作 DOM 解析后的节点即可。
复制带样式的 HTML 到剪贴板	使用 Clipboard API 的 write() 方法，构造 text/html 的 Blob 数据。参考：new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })
国内访问 Unsplash 可能较慢	前端展示时使用 Unsplash 的 &w=400&h=300&fit=crop 参数压缩图片；后期可考虑使用代理或切换到国内图库 API（如 500px 中国版）。
XSS 注入风险	虽然是你自己使用，但作为产品需有安全意识。引入 DOMPurify 对 v-html 内容进行净化。
配置数据持久化	使用 localStorage 保存用户自定义的主题配置，关闭浏览器后不丢失。
