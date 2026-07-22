# 净排 · 代码缺陷修复与质量提升计划

> 基于 2026-07-17 代码审查（v0.12.0）
> 审查范围：提取模块 / App.vue / 测试 / 工具链
> 构建 ✅ 测试 ✅（21/21）

---

## 📋 总览

| 批次 | 数量 | 内容 | 预估总工时 |
|------|:----:|------|:---------:|
| 🔴 P0 · 必须修复 | 3 | 光标定位偏移、AI 竞态、XSS 裸调用 | 2h |
| 🟡 P1 · 建议修复 | 6 | 品牌色工具函数、超时测试、标题提取、主题兜底测试、密钥泄漏防护、深色按钮对比度 | 3h |
| 💭 P2 · 伺机优化 | 3 | THEMES nestedList 去重、标签渲染覆盖率、空状态字色 | 1.5h |

---

## 🔴 P0 · 必须修复（3 项）

### #1 光标定位偏移 · `getEditorMarkdownOffset`

| 字段 | 内容 |
|------|------|
| **问题** | `lastIndexOf(textBefore)` 在重复文本段落中选择最后一处匹配，导致装饰块/图片插入位置严重偏移 |
| **文件** | `src/App.vue:L969-983` |
| **影响** | 编辑器中有重复词句时，插入封面/分割线/图片会落到错误位置 |
| **方案** | 利用 ProseMirror Selection `from` 坐标直接计算 offset，避免依赖 markdown 字符串搜索 |
| **风险** | 低——ProseMirror 的 `from` 是绝对位置，只需找到对应 markdown 字符索引 |
| **测试** | 插入装饰块后验证 markdown 文本中插入位置与光标在编辑器中的位置一致 |

**实现要点：**
```javascript
// 方案：使用 textBetween(0, from) 后按字符数累加偏移量
// 原理：每个 ProseMirror doc 字符对应一个 markdown 字符，
// 但需跳过非文本节点（如图片的 alt 文字）
const getEditorMarkdownOffset = () => {
  if (!milkdownEditor) return markdownText.value.length;
  return milkdownEditor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { from } = view.state.selection;
    // 直接从 ProseMirror 获取 doc 文本量推算 offset
    return from;
  });
};
```

---

### #2 `callAI.js` 模块级竞态 · AbortController 覆盖

| 字段 | 内容 |
|------|------|
| **问题** | `aiAbortCtrl` 和 `aiTimedOut` 是模块级变量，并发调用会互相覆盖 |
| **文件** | `src/callAI.js:L3-4, L78, L84-86` |
| **影响** | 取消按钮在特定时序下可能无法正确中断当前请求 |
| **方案** | 返回 `cancel` 函数替代模块级状态，让调用方管理取消逻辑 |
| **风险** | 低——当前 UI 层有 `aiLoading` 按钮 disabled，但模块设计需要加固 |

**实现要点：**
```javascript
export const callAI = async (systemPrompt, userPrompt, deps) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => { ... }, 30000);
  const promise = (async () => {
    // ... 现有逻辑
  })();
  return {
    result: await promise,
    cancel: () => ctrl.abort(),
    timedOut: false,
  };
};

// App.vue 层：
const currentAIOperation = ref(null);
const callAI = (systemPrompt, userPrompt) => {
  const op = _extCallAI(systemPrompt, userPrompt, { ... });
  currentAIOperation.value = op;
  return op.result;
};
const cancelAI = () => currentAIOperation.value?.cancel?.();
```

---

### #3 `buildHtml` 裸调用缺少 XSS 防护

| 字段 | 内容 |
|------|------|
| **问题** | `buildHtml()` 内部未对 `marked.parse()` 输出做 `DOMPurify` 过滤，直接返回裸 HTML |
| **文件** | `src/buildHtml.js:L93` |
| **影响** | 如果第三方直接使用 `buildHtml()` 插入 DOM，存在 XSS 风险 |
| **方案** | 在 `buildHtml` 中增加 DOMPurify 选项参数，或导出 `safeBuildHtml` 包装函数 |
| **风险** | 低——当前 App.vue 在调用层做了 sanitize，但模块边界需要明确 |

**实现要点：**
```javascript
// buildHtml.js
import DOMPurify from 'dompurify';

export const buildHtml = (md, theme, overrides, brand, options = {}) => {
  // ... 现有逻辑
  const result = `<div style="${t.body}">${html}</div>`;
  return options.sanitize !== false
    ? DOMPurify.sanitize(result)
    : result;
};
```

---

## 🟡 P1 · 建议修复（6 项）

### #4 提取共享品牌色工具函数

| 字段 | 内容 |
|------|------|
| **文件** | `src/buildHtml.js:L66-78` + `src/App.vue:L1008-1022` |
| **方案** | 将品牌色重染逻辑提取到 `buildHtml.js` 中导出一个 `applyBrandToTheme(t, brand)` 函数 |
| **预估** | 20min |

---

### #5 补充 30s 超时测试

| 字段 | 内容 |
|------|------|
| **文件** | `tests/callAI.test.js` |
| **方案** | 用 `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(30000)` 验证超时后 toast 和 loading 状态 |
| **预估** | 15min |

---

### #6 `aiGenerateTitle` 标题提取逻辑加固

| 字段 | 内容 |
|------|------|
| **文件** | `src/App.vue:L1619` |
| **方案** | 若 AI 返回的标题被 strip 后为空，保留原始内容；给 AI prompt 加格式约束 |
| **预估** | 15min |

---

### #7 主题兜底测试改为特征验证

| 字段 | 内容 |
|------|------|
| **文件** | `tests/buildHtml.test.js:L108-112` |
| **方案** | `toBe()` → 验证 `serif_news` 的特征颜色 `#8b0000` 出现在输出中 |
| **预估** | 5min |

---

### #8 补充分离错误与敏感信息测试

| 字段 | 内容 |
|------|------|
| **文件** | `tests/callAI.test.js` |
| **方案** | mock 错误响应体包含类似 key 的敏感串，验证 toast 中未暴露 |
| **预估** | 15min |

---

### #9 深色模式下预览按钮对比度优化

| 字段 | 内容 |
|------|------|
| **文件** | `src/App.vue` CSS section |
| **方案** | `.preview-btn.active` 添加 `:root[data-theme="dark"]` selector，调整高亮色 |
| **预估** | 10min |

---

## 💭 P2 · 伺机优化（3 项）

### #10 THEMES nestedList 去重

| 内容 | 预估 |
|------|:----:|
| 所有 10 个主题的 `nestedList` 值完全一致，提取为 `DEFAULT_THEME_OPTS` | 15min |

### #11 补充更多标签的渲染测试

| 内容 | 预估 |
|------|:----:|
| 当前测试覆盖 h1/p/ul/ol/img/a，缺 `code`/`pre`/`table`/`strong`/`em`/`hr` 等 18 个标签 | 30min |

### #12 空状态提示深色模式字色

| 内容 | 预估 |
|------|:----:|
| `.phone-content` 硬编码 `color:#3e3e3e` 在深色模式下对比度偏低 | 5min |

---

## 🗺 执行路线图

```
批次 1（P0 · 今日优先）
┌──────────────────────────┐
│ #3 buildHtml XSS 防护    │ ← 安全底线
│ #1 光标定位偏移修复      │ ← 功能正确性
│ #2 AI 竞态加固           │ ← 模块健壮性
└──────────┬───────────────┘
           ▼
批次 2（P1 · 明后日）
┌──────────────────────────┐
│ #5 补充超时测试          │ ← 测试覆盖薄弱点
│ #6 标题提取加固          │ ← 用户体验
│ #4 品牌色工具提取        │ ← 可维护性
│ #7 主题兜底测试          │ ← 测试健壮性
│ #8 密钥泄漏测试          │ ← 安全
│ #9 深色按钮对比度        │ ← 无障碍
└──────────┬───────────────┘
           ▼
批次 3（P2 · 有空再做）
┌──────────────────────────┐
│ #10 THEMES 去重           │
│ #11 更多标签测试          │
│ #12 空状态字色            │
└──────────────────────────┘
```

---

## 响应策略

- **每项修复**：单独改动 → `vite build` + `vitest run` 双验证 → 更新 CHANGELOG
- **完成后**：`git commit` + 标注对应 # 编号
- **不修改** `buildHtml` 输出结构、THEMES 数据格式、AI 业务语义
