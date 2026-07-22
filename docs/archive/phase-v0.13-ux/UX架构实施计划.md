# 计划：用户体验架构实施

> 日期：2026-07-17
> 状态：草案（等待确认）
> 决策者：用户体验架构师

---

## 前置说明

本计划遵循 STANDARDIZATION.md 的标准化流程。所有实施项按「从用户感知最强→技术债最重」的优先级排列，确保：
- **P0**：用户打开页面第一眼就能感受到的变化（工具栏、入门引导）
- **P1**：提升日常写作体验的结构性改进（上下文工具栏、状态栏、模块拆分）
- **P2**：体验增益明确但非紧急的优化（AI 场景化、面板系统上下文保持、Onboarding 完善）

每项实施都包含：
1. **技术方案** — 具体用什么代码/技术实现
2. **选型理由** — 为什么用这个方案而不是其他
3. **达成目标** — 用户能感知到什么变化

---

## P0（必须立即做）

---

### P0-1：工具栏信息架构重构

#### 目标

将当前 13 个按「实现顺序」排列的工具栏图标重排为「任务导向」分组，并添加文字标签。

#### 当前状态

```
品牌 → AI → 导入 → 样式 → 撤销 → 重做 → 装饰 → 复制 → 清除样式 → 预览 → 导出 → 设置 → 外观
```

每个按钮只有 72px × 56px 的图标，无文字，仅靠 `title` tooltip 表达含义。

#### 技术方案

**代码位置**：`src/App.vue` 模板部分（L41–207 区间）

**改动一：分组排列（按任务流）**

将按钮分为 5 组，组间用 1px 分隔线（竖线 + 间距）：

```
[写作区]  新建文档  ·  载入模板  ·  撤销  ·  重做    ← 撤销放明面上
──
[排版区]  主题      ·  样式        ·  装饰  ·  图片    ← 图片和装饰归入排版
──
[增强区]  AI 写作                                    ← 核心功能独立
──
[发布区]  预览      ·  复制 HTML  ·  导出
──
[系统区]  设置      ·  外观
```

**改动二：文字标签**

每个按钮从纯图标（72px 宽）改为**图标 + 下方 10px 文字**（宽度可缩至 56px）：

```html
<!-- 改动前（当前） -->
<div class="toolbar-item" role="button" title="复制 HTML" @click="copyHtml">
  <svg><!-- 复制图标 --></svg>
</div>

<!-- 改动后 -->
<div class="toolbar-item" role="button" title="复制 HTML" @click="copyHtml">
  <svg><!-- 复制图标 --></svg>
  <span class="toolbar-label">复制</span>
</div>
```

**改动三：组分隔线**

```css
.toolbar-group {
  border-bottom: 1px solid var(--border-light);
  padding: 4px 0;
}
.toolbar-group:last-child {
  border-bottom: none;
}
.toolbar-label {
  font-size: 10px;
  line-height: 1;
  margin-top: 2px;
  color: var(--text-tertiary);
  text-align: center;
  display: block;
}
```

#### 选型理由

| 方案 | 优缺点 | 为何选此 |
|------|--------|----------|
| **图标+文字标签** | + 新用户一眼看懂；- 宽度稍增 | 当前 72px 足够容纳，无需整体布局调整 |
| 纯图标 + hover 弹框 | 当前方案，已证实不够 | 新用户 hover 率低，认知负担高 |
| 独立文字工具栏 | 占用更多横向空间 | 受限于整体布局宽度，不可行 |

#### 达成目标

用户打开净排后，**不再需要 hover 猜测每个图标的功能**。5 个分组标签帮助用户理解「净排能帮我做什么」：
- 写作区：写作入口
- 排版区：决定文章长什么样
- 增强区：给文章增色
- 发布区：怎么把文章拿出去
- 系统区：工具本身的设置

#### 工作量估算

| 文件 | 改动类型 | 预估行数 |
|------|---------|---------|
| `src/App.vue`（模板） | 修改 ~120 行 | ~15 行新增 |
| `src/App.vue`（样式） | 新增 ~30 行 CSS | ~30 行新增 |
| `src/App.vue`（逻辑） | 无 | 0 |
| **合计** | | **~45 行净增** |

---

### P0-2：新手 Onboarding 三步卡片

#### 目标

首次使用净排的用户（localStorage 无 `podcast_settings`），在编辑器空状态加载前展示轻量 Onboarding 浮层。

#### 技术方案

**代码位置**：`src/App.vue` 新增一个浮层组件（内联在模板中）

**实现思路**：

```vue
<!-- Onboarding 浮层模板 -->
<Transition name="fade">
  <div v-if="showOnboarding" class="onboarding-overlay" @click.self="closeOnboarding">
    <div class="onboarding-card">
      <div class="onboarding-step">
        <!-- 步骤 1/3 指示器 -->
        <div class="step-dots">
          <span class="dot" :class="{ active: onboardingStep === 1 }">•</span>
          <span class="dot" :class="{ active: onboardingStep === 2 }">•</span>
          <span class="dot" :class="{ active: onboardingStep === 3 }">•</span>
        </div>
        <!-- 步骤内容条件渲染 -->
        <div v-if="onboardingStep === 1">
          <div class="step-icon">✍️</div>
          <h3>Markdown 写，实时预览公众号样式</h3>
          <p>左侧写 Markdown，右侧手机框里就是公众号发布后的效果。</p>
        </div>
        <div v-if="onboardingStep === 2">
          <div class="step-icon">🎨</div>
          <h3>选主题，一键铺满全文</h3>
          <p>10 套预设主题任选，排版风格一步到位。</p>
        </div>
        <div v-if="onboardingStep === 3">
          <div class="step-icon">📋</div>
          <h3>复制 HTML，粘贴即发布</h3>
          <p>点「复制 HTML」→ 去微信后台粘贴 → 封面/分割线自动生效。</p>
        </div>
        <div class="onboarding-actions">
          <button v-if="onboardingStep < 3" @click="onboardingStep++" class="btn-primary">
            下一步
          </button>
          <button v-else @click="finishOnboarding" class="btn-primary">
            开始创作
          </button>
          <button @click="skipOnboarding" class="btn-skip">跳过</button>
        </div>
      </div>
    </div>
  </div>
</Transition>
```

**触发逻辑**：

```javascript
const showOnboarding = ref(false);
const onboardingStep = ref(1);

onMounted(() => {
  const settings = JSON.parse(localStorage.getItem('podcast_settings') || '{}');
  // 首次使用且无草稿，展示 Onboarding
  if (!settings.onboardingDone && !localStorage.getItem('podcast_draft')) {
    showOnboarding.value = true;
  }
});

function finishOnboarding() {
  const settings = JSON.parse(localStorage.getItem('podcast_settings') || '{}');
  settings.onboardingDone = true;
  localStorage.setItem('podcast_settings', JSON.stringify(settings));
  showOnboarding.value = false;
  // 完成后自动载入示例文章
  loadSampleArticle();
}
```

#### 选型理由

| 方案 | 优缺点 | 为何选此 |
|------|--------|----------|
| **内联浮层组件** | + 零新增依赖；+ 与现有 Transition 模式一致；- 代码在单文件中 | 遵循「暂不拆分组件」约束 |
| 独立 `Onboarding.vue` 组件 | + 代码更整洁；- 需要新增文件 | 待 P1 组件拆分时再独立 |
| 第三方引导库（Shepherd.js） | ✗ 引入外部依赖 | 违反「不引入新外部依赖」约束 |

#### 达成目标

**首屏挫败感消除**。新用户不再面对「空编辑器 + 一堆图标」，而是在 3 步内理解净排的核心价值（写+排+发），然后自动载入示例进入使用状态。

#### 工作量估算

| 文件 | 改动类型 | 预估行数 |
|------|---------|---------|
| `src/App.vue`（模板） | 新增 ~50 行 | ~50 行 |
| `src/App.vue`（逻辑） | 新增 ~25 行 | ~25 行 |
| `src/App.vue`（样式） | 新增 ~60 行 CSS | ~60 行 |
| **合计** | | **~135 行净增** |

---

## P1（按节奏推进）

---

### P1-1：顶部上下文工具栏

#### 目标

当用户在编辑器内选中内容（文字/图片）时，编辑器上方浮现与该内容相关的操作按钮，减少「选中 → 切到工具栏 → 找对应功能」的步骤。

#### 技术方案

**整体思路**：监听 Milkdown（ProseMirror）的选区变化，根据选中节点类型动态显示不同的操作按钮。

**代码位置**：`src/App.vue` 新增一个 `contextBar` 模板区 + 逻辑

**第一步：从 Milkdown 获取选区信息**

对 Milkdown 的 `markdownUpdated` 回调进行增强，增加选区类型检测能力。不直接监听 ProseMirror（API 较底层），而是通过 Milkdown 的 `editor.action(ctx => ...)` 获取选区状态：

```javascript
import { editorView } from '@milkdown/kit/view';

// 在 editor 初始化后注册选区监听
function setupSelectionListener() {
  setInterval(() => {
    const view = milkdownEditor?.action(ctx => ctx.get(editorView.key));
    if (!view) return;
    const { state } = view;
    const { selection } = state;
    const node = selection.$from.node();
    
    if (!node) {
      selectedType.value = 'text';
      return;
    }
    
    // 检测选中内容类型
    if (node.type.name === 'image') {
      selectedType.value = 'image';
      selectedNodeAttrs.value = node.attrs;
    } else if (node.type.name === 'heading') {
      selectedType.value = 'heading';
    } else {
      selectedType.value = 'text';
    }
  }, 500); // 每 500ms 检查一次选区变化
}
```

**替代方案（更优）**：用 `@milkdown/kit` 的 `ctx` hook 注册监听，避免 `setInterval`。但当前净排不直接使用 ctx 系统，为最小化改动，采用轻量的轮询方案。

**第二步：模板渲染**

```vue
<!-- 顶部上下文工具栏（嵌入在编辑器上方） -->
<Transition name="slide-down">
  <div v-if="selectedType && activePanel !== 'settings'" class="context-bar">
    <!-- 选中图片时：调整宽度、替换、删除 -->
    <template v-if="selectedType === 'image'">
      <span class="context-label">图片</span>
      <label class="context-field">
        宽度
        <input type="range" min="50" max="100" v-model="imageWidth" @input="updateImageWidth" />
        <span class="value">{{ imageWidth }}%</span>
      </label>
      <button class="context-btn" @click="replaceImage">替换</button>
      <button class="context-btn danger" @click="deleteImage">删除</button>
    </template>
    
    <!-- 选中标题时：调层级 -->
    <template v-if="selectedType === 'heading'">
      <span class="context-label">标题</span>
      <select v-model="headingLevel">
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
      </select>
    </template>
    
    <!-- 选中文字时：AI 操作 -->
    <template v-if="selectedType === 'text' && selectionLength > 10">
      <span class="context-label">文字</span>
      <button class="context-btn" @click="aiExpand">扩写</button>
      <button class="context-btn" @click="aiRewrite">改写</button>
      <button class="context-btn" @click="aiTranslate">翻译</button>
    </template>
  </div>
</Transition>
```

**第三步：CSS 样式**

```css
.context-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  border-radius: 8px 8px 0 0;
  font-size: 12px;
}

.context-label {
  font-weight: 600;
  color: var(--text-tertiary);
  margin-right: 4px;
}

.context-btn {
  padding: 4px 10px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 12px;
}

.context-btn:hover {
  background: var(--bg-hover);
}

.context-btn.danger {
  color: #e74c3c;
  border-color: #e74c3c;
}
```

#### 选型理由

| 方案 | 优缺点 | 为何选此 |
|------|--------|----------|
| **轮询监听选区变化** | + 实现简单；+ 与现有代码无侵入；- 500ms 间隔稍粗糙 | 在 Milkdown ctx 系统未深入使用的现状下是最小改动方案 |
| Milkdown ctx hook | + 更优雅；- 需要理解 Milkdown 的 ctx/Ctx 系统 | 留作后续优化，当前不引入新复杂度 |
| 监听 DOM selectionchange | + 浏览器原生 API；- 与 ProseMirror 内部选区不同步 | 不可行，html 选区与 editor 选区概念不同 |

#### 达成目标

用户的「选中 → 操作」路径从目前的 3 步（选中 → 点击对应面板 → 在面板里操作）缩短为 2 步（选中 → 工具栏直接操作）。尤其图片编辑场景改善最明显。

#### 工作量估算

| 文件 | 改动类型 | 预估行数 |
|------|---------|---------|
| `src/App.vue`（模板） | 新增 ~50 行 | ~50 行 |
| `src/App.vue`（逻辑） | 新增 ~60 行 | ~60 行 |
| `src/App.vue`（样式） | 新增 ~40 行 | ~40 行 |
| **合计** | | **~150 行净增** |

---

### P1-2：底部状态栏

#### 目标

在编辑器底部新增状态栏，为用户提供写作过程中的即时反馈（字数/阅读时长/保存状态/AI 建议）。

#### 技术方案

**代码位置**：`src/App.vue`，在编辑器区域下方新增状态栏

**核心逻辑**：

```javascript
// 计算属性 - 字数统计
const wordCount = computed(() => {
  const plain = markdownText.value
    .replace(/^#+\s+/gm, '')  // 去掉标题标记
    .replace(/[>\*\_\~\`\|]/g, '') // 去掉 markdown 符号
    .replace(/\s+/g, '')  // 去掉空白
    .replace(/!\[.*?\]\(.*?\)/g, '') // 去掉图片标记
    .replace(/\[.*?\]\(.*?\)/g, ''); // 去掉链接标记
  return plain.length;
});

// 计算属性 - 预估阅读时长（中文 400 字/分钟）
const readTime = computed(() => {
  return Math.max(1, Math.round(wordCount.value / 400));
});

// 计算属性 - 保存状态
const saveStatus = computed(() => {
  if (isSaving.value) return '正在保存⋯';
  if (lastSavedTime.value) {
    const diff = Date.now() - lastSavedTime.value;
    if (diff < 60000) return '刚刚保存';
    const minutes = Math.floor(diff / 60000);
    return `${minutes} 分钟前保存`;
  }
  return '未保存';
});
```

**模板**：

```vue
<div class="status-bar">
  <span class="status-item">{{ wordCount }} 字</span>
  <span class="status-sep">·</span>
  <span class="status-item">约 {{ readTime }} 分钟</span>
  <span class="status-sep">·</span>
  <span class="status-item">{{ saveStatus }}</span>
  <span v-if="aiLoading" class="status-item ai-status">
    <span class="ai-spinner"></span>
    AI 写作中⋯
  </span>
</div>
```

**CSS**：

```css
.status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  font-size: 11px;
  color: var(--text-tertiary);
  height: 28px;
}

.status-sep {
  opacity: 0.3;
}

.status-item.ai-status {
  color: var(--accent-blue);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ai-spinner {
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--accent-blue);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ai-spin 0.6s linear infinite;
}
```

#### 选型理由

| 方案 | 优缺点 | 为何选此 |
|------|--------|----------|
| **纯 computed + CSS** | + 无新增依赖；+ 响应式即时更新；+ 与当前架构一致 | 最简单的实现方式 |
| 使用第三方状态库 | ✗ 引入新依赖 | 违反「不引入新外部依赖」约束 |

#### 达成目标

用户写作时**底部始终可见**字数统计和保存状态。从「不知道自己写多少字了」变成「随时感知写作进度」。AI 加载状态也集成在这里，而不是仅靠 AI 面板内的 spinner。

#### 工作量估算

| 文件 | 改动类型 | 预估行数 |
|------|---------|---------|
| `src/App.vue`（模板） | 新增 ~15 行 | ~15 行 |
| `src/App.vue`（逻辑） | 新增 ~25 行 | ~25 行 |
| `src/App.vue`（样式） | 新增 ~25 行 | ~25 行 |
| **合计** | | **~65 行净增** |

---

### P1-3：模块组件化拆分

#### 目标

将 3358 行的 `App.vue` 拆分为可维护的模块。遵循 CODING_STANDARDS.md 中的拆分原则——只在线逻辑 > 200 行且逻辑独立时拆分。

#### 技术方案

**整体架构**：Vue 3 Composition API + 组合式函数（composables）+ 少量子组件

**架构图**：

```
App.vue（布局框架：左工具栏 + 编辑器 + 预览 + 状态栏）
 ├── 拆出 composables/
 │   ├── useTheme.js      → 主题切换、样式覆写、品牌色逻辑
 │   ├── useDraft.js      → 草稿保存/恢复/自动保存
 │   ├── useBrand.js      → 品牌色/字体读写
 │   └── useAI.js         → AI 调用状态管理（非 callAI 业务）
 │
 └── 拆出 components/（仅在逻辑 > 200 行时）
     ├── PreviewPanel.vue    → 预览区（手机框 + WeChat 顶栏）
     ├── StylePanel.vue      → 样式调节面板（主题选择 + 自定义覆盖）
     └── AIPanel.vue         → AI 写作面板
```

**composable 模式**（示例：`useDraft.js`）：

```javascript
// src/composables/useDraft.js
import { ref, watch, onUnmounted } from 'vue';

export function useDraft(markdownText) {
  const lastSavedTime = ref(null);
  const isSaving = ref(false);
  const showRecoveryBanner = ref(false);
  let autoSaveTimer = null;

  // 从 localStorage 恢复草稿
  function loadDraft() {
    const saved = localStorage.getItem('podcast_draft');
    if (saved && saved.trim()) {
      showRecoveryBanner.value = true;
      return saved;
    }
    return '';
  }

  // 保存草稿
  function saveDraft() {
    isSaving.value = true;
    localStorage.setItem('podcast_draft', markdownText.value);
    lastSavedTime.value = Date.now();
    // 用 requestAnimationFrame 延迟状态更新，避免 UI 闪烁
    requestAnimationFrame(() => {
      isSaving.value = false;
    });
  }

  // 自动保存（编辑器内容变化 3 秒后自动保存）
  watch(markdownText, () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveDraft();
    }, 3000);
  });

  onUnmounted(() => {
    clearTimeout(autoSaveTimer);
    // 退出时立即保存
    saveDraft();
  });

  return {
    lastSavedTime,
    isSaving,
    showRecoveryBanner,
    loadDraft,
    saveDraft,
  };
}
```

**composable 模式**（示例：`useTheme.js`）：

```javascript
// src/composables/useTheme.js
import { ref, computed } from 'vue';
import { THEMES, THEME_NAMES } from '../themes.js';

export function useTheme(settings) {
  const currentTheme = ref(settings.value?.theme || 'serif_news');
  const customOverrides = ref(JSON.parse(
    localStorage.getItem('podcast_theme_overrides') || '{}'
  ));

  // 合并后的完整样式
  const mergedTheme = computed(() => {
    const base = { ...THEMES[currentTheme.value] };
    Object.entries(customOverrides.value).forEach(([key, val]) => {
      if (val) base[key] = val;
    });
    return base;
  });

  function applyTheme(themeName) {
    currentTheme.value = themeName;
    customOverrides.value = { ...THEMES[themeName] };
    // 持久化
    const s = JSON.parse(localStorage.getItem('podcast_settings') || '{}');
    s.theme = themeName;
    localStorage.setItem('podcast_settings', JSON.stringify(s));
  }

  return {
    currentTheme,
    customOverrides,
    mergedTheme,
    applyTheme,
    THEMES,
    THEME_NAMES,
  };
}
```

#### 为什么要拆分（而非保持单文件）

| 维度 | 单文件 3358 行 | 拆分后 |
|------|---------------|--------|
| **可读性** | 滚动查看所有逻辑，搜索耗时 | 按文件定位，一目了然 |
| **可测性** | 所有状态在 `setup()` 内，难以独立测试 | composable 可导出后单独写 `.spec.js` |
| **可维护性** | 一次改动需要理解全部上下文 | 局部改动只影响对应 composable |
| **协作** | 无法多人并行开发 | 组件/composable 天然边界清晰 |
| **初次加载** | 全量代码一次加载 | 无变化（构建层面不拆） |

拆分后编译产物体积**不变**（Vite 在生产构建时会 tree-shake），冷启动性能**不变**（无网络加载）。**仅开发体验和可维护性提升**。

#### 工作量估算

| 新文件 | 拆出行数 | 从 App.vue 移除行数 |
|--------|---------|-------------------|
| `src/composables/useTheme.js` | ~80 行 | ~200 行 |
| `src/composables/useDraft.js` | ~60 行 | ~100 行 |
| `src/composables/useBrand.js` | ~40 行 | ~60 行 |
| `src/composables/useAI.js` | ~50 行 | ~80 行 |
| `src/components/PreviewPanel.vue` | ~100 行 | ~120 行 |
| `src/components/StylePanel.vue` | ~200 行 | ~250 行 |
| `src/components/AIPanel.vue` | ~150 行 | ~200 行 |
| **合计** | **~680 行拆分** | **~1010 行从 App.vue 移除** |

拆分后 `App.vue` 预计从 3358 行 → **≤2000 行**，净减 ~1350 行。

#### 风险与规避

| 风险 | 规避措施 |
|------|---------|
| 拆后 composable 间状态耦合 | 每个 composable 返回独立 ref，不做全局 store |
| 面板组件与 App.vue 之间 props 传递过多 | 采用「直接引用 composable」而非 props 逐层传递 |
| 拆分过程中间状态不可用 | 每次拆分后 `npm run dev` + `vite build` 验证无错才能提交 |
| 面板组件拆出后与 Milkdown 交互变复杂 | 保持面板通过 `markdownText` ref 与编辑器交互，不直接操作 Milkdown API |

---

## P2（体验增益）

---

### P2-1：AI 场景化推荐（替代 4 个平铺按钮）

#### 目标

将 AI 面板从「4 个按钮平铺」改为「根据编辑器上下文推荐操作」。

#### 技术方案

**核心思路**：不再显示 4 个固定按钮，而是分析当前编辑器内容和光标位置，推荐最合适的 AI 操作。

```javascript
function recommendAIAction() {
  const md = markdownText.value;
  const cursor = getCursorPosition(); // 从 Milkdown 获取光标位置
  const beforeCursor = md.slice(0, cursor);
  const selected = getSelectedText(); // 从 Milkdown 获取选中文本

  // 推荐逻辑
  if (selected && selected.length > 10) {
    return { type: 'transform', actions: ['扩写', '改写', '翻译', '简化为摘要'] };
  }
  if (beforeCursor.trim() === '' && md.trim().length < 20) {
    return { type: 'generate', actions: ['生成标题', '写开头'] };
  }
  if (md.length > 500 && !md.includes('## ')) {
    return { type: 'structure', actions: ['结构化排版'] };
  }
  return { type: 'general', actions: ['生成标题', '写摘要', '扩写段落', '结构化排版'] };
}
```

#### 达成目标

AI 面板不再是「4 个一样大的按钮要用户自己选」，而是智能推荐 1-2 个最合适的操作，并附带「点击可预览效果」的能力。

---

### P2-2：面板系统上下文保持

#### 目标

面板切换时不丢失用户之前的操作状态（滑杆位置、输入框内容等）。

#### 技术方案

将每个面板的状态保持为 ref，而非每次面板关闭时销毁：

```javascript
// 当前（每次切换面板时 ref 重新初始化）
const selectedTag = ref('h1');
const fontSize = ref(17);

// 改进：按面板持久化
const panelStates = reactive({
  style: { selectedTag: 'h1', fontSize: 17, customCss: '' },
  decor: { coverText: '', quoteText: '' },
  ai: { prompt: '', model: 'deepseek' },
  export: { format: 'html' },
});
```

---

### P2-3：Onboarding 完善

在 P0-2 的三步卡片基础上增加：
- Onboarding 完成后展示「功能亮点标签云」（已在 v0.12.0 中半实现）
- 非首次使用时，提供「小提示」条（编辑器底部轻量提示「试试选中文字，顶部会有 AI 工具条哦」）

---

## 响应式与断点

### 平板断点适配（768–1024px）

当前已有 `@media (max-width: 768px)` 和 `min-width: 769px`，缺少中间断点。本次新增布局「上下文工具栏」和「状态栏」后，断点策略跟随现有模式：

```css
/* 平板：上下文工具栏降低高度，状态栏精简文字 */
@media (max-width: 1024px) {
  .context-bar {
    font-size: 11px;
    gap: 4px;
    padding: 4px 8px;
  }
  .status-bar {
    font-size: 10px;
  }
}
```

### 深色模式适配

所有新增组件（上下文工具栏、状态栏、Onboarding 浮层）都已使用现有 CSS 变量（`--bg-secondary`, `--border-light`, `--text-tertiary` 等），**深色模式自动继承**，无需额外适配。

---

## 风险矩阵

| 风险 | 可能性 | 影响 | 规避策略 |
|------|--------|------|---------|
| 工具栏重排后老用户找不到功能 | 高 | 中 | 保留原有按钮名称，仅重排位置；CHANGELOG 清晰说明 |
| 上下文工具栏轮询影响性能 | 低 | 低 | 500ms 间隔足够缓，实测可接受 |
| Onboarding 与自动恢复草稿冲突 | 中 | 低 | 代码中有草稿时跳过 Onboarding |
| 模块拆分时遗漏状态依赖 | 中 | 高 | 每拆一个 → `npm run dev` 验证 → git commit，不做大爆炸式拆分 |

---

## 依赖变化

**零新增依赖。** 所有实现均使用项目已有的：
- Vue 3 (`ref`, `reactive`, `computed`, `Transition`)
- Milkdown (`editorView` for 选区检测)
- localStorage（持久化 Onboarding 状态、面板状态）
- 现有的 CSS 变量系统

---

## 时间线（估算）

| 项 | 工时估算 | 依赖 |
|----|---------|------|
| **P0-1 工具栏重排** | 1–2 小时 | 无 |
| **P0-2 Onboarding** | 2–3 小时 | 无 |
| **P1-1 上下文工具栏** | 3–4 小时 | P0-1 完成后 |
| **P1-2 底部状态栏** | 1–2 小时 | 无 |
| **P1-3 模块拆分** | 4–6 小时 | P0-1 完成后（拆分时模板已定） |
| **P2 体验增益** | 待定 | P0+P1 完成后 |

---

## 确认清单（等待您逐项确认）

| 序号 | 项 | 确认 | 备注 |
|------|---|------|------|
| 1 | P0-1 工具栏分组 + 文字标签方案 | ⬜ | 5 组分法是否合理？ |
| 2 | P0-2 Onboarding 三步卡片 | ⬜ | 三步骤文案是否准确？ |
| 3 | P1-1 顶部上下文工具栏 | ⬜ | 选区检测用轮询还是 Milkdown ctx？ |
| 4 | P1-2 底部状态栏 | ⬜ | 是否加入字数/阅读时长/保存状态？ |
| 5 | P1-3 模块拆分顺序 | ⬜ | 先拆 composables 还是先拆组件？ |
| 6 | P2 项是否纳入本轮 | ⬜ | AI 场景化是否放后？ |
