# 净排 · 编码规范

> 文档版本：v1.0 · 2026-07-17
> 本文档是对 ESLint/Prettier 规则的文字补充，涵盖工具无法自动检查的编码约定。

---

## 1. 通用原则

### 1.1 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 变量 | camelCase | `markdownText`, `showPreview` |
| 函数 | camelCase | `buildHtml()`, `callAI()` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_CONTENT`, `THEMES` |
| 组件 | PascalCase | `App.vue` → `App` |
| ref | camelCase | `isLoading`, `aiLoading` |
| computed | camelCase | `savedLabel`, `editorThemeCss` |
| CSS 类 | kebab-case | `.toolbar-item`, `.panel-content` |
| CSS 变量 | kebab-case | `--bg-primary`, `--text-secondary` |

### 1.2 代码组织

- 一个文件只做一件事
- 相关逻辑写在一起（不是把所有 `ref` 放一起、所有 `function` 放一起）
- 复杂函数超过 80 行考虑拆分

### 1.3 注释原则

```javascript
// ❌ 不写"是什么"——代码本身应该说明：
const count = 5;  // 设置 count 为 5

// ✅ 写"为什么"——解释决策原因和坑点：
// 使用 replaceAll 而非直接赋值，因为 milkdown 的 markdownUpdated
// 监听器需要在编辑器就绪后才注册，否则首屏会被清空
function setEditorMarkdown(md) {
  milkdownEditor?.action(replaceAll(md));
}
```

---

## 2. Vue 3 规范

### 2.1 Composition API

- 推荐使用 `<script setup>` 语法
- 基本类型用 `ref()`，对象用 `reactive()` 或 `ref()`
- `computed` 必须是纯函数，不允许有副作用
- `watch` 必须指定 `deep` / `immediate` / `flush` 参数

### 2.2 防循环模式

净排中 Milkdown 编辑器和 `markdownText` 需要双向同步。标准模式：

```javascript
const isSettingEditor = ref(false);
const isFromEditor = ref(false);

watch(markdownText, (newMd) => {
  // 来自程序化改写 → 跳过，不推回编辑器
  if (isSettingEditor.value) return;
  isFromEditor.value = false;
  milkdownEditor?.action(replaceAll(newMd));
  isFromEditor.value = true;
});
```

### 2.3 生命周期

- `onMounted` 中注册的事件/监听器，必须在 `onUnmounted` 中移除
- `setInterval` / `setTimeout` 必须在 `onUnmounted` 中清理
- Milkdown 编辑器实例必须在 `onUnmounted` 中 `.destroy()`

---

## 3. 测试规范

### 3.1 测试范围

- **P0**：核心逻辑（`buildHtml`、`callAI`、数据完整性）
- **P1**：辅助逻辑（装饰元素处理、样式注入）
- **P2**：UI 渲染（工具栏、面板交互）

### 3.2 测试写法原则

```javascript
// ❌ 不要测试 DOM 渲染
expect(wrapper.find('.toolbar-item').exists()).toBe(true);

// ✅ 测试纯逻辑函数的输入输出
describe('buildHtml()', () => {
  it('应生成合法的微信 HTML 结构', () => {
    const html = buildHtml('# 标题\n正文内容', THEMES.default);
    expect(html).toContain('<h1');
    expect(html).toContain('style=');
  });

  it('含装饰元素时，应渲染为 CSS 卡片', () => {
    const html = buildHtml('::: cover\n标题\n:::', THEMES.default, '#07c160');
    expect(html).toContain('data-decor="cover"');
  });
});
```

---

## 4. 文件组织

```
src/
├── main.js           # 入口（保持简洁）
└── App.vue           # 全部逻辑（长期可考虑拆分）

tests/
├── buildHtml.test.js # 核心排管线测试
├── callAI.test.js    # AI 功能测试
└── ...

docs/
├── STANDARDIZATION.md
├── CODING_STANDARDS.md
├── RELEASE_CHECKLIST.md
├── PRD/            # 需求文档
├── design/         # 架构决策
└── templates/      # 模板
```

> **组件拆分原则**：只有满足以下条件时才拆：
> 1. 代码在其他地方可复用
> 2. 逻辑复杂度明显可独立（>200 行）
> 3. 不引入新的跨文件状态管理复杂度
