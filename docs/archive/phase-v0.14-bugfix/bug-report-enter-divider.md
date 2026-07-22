# 🔍 Bug 排查报告：Enter 分割线 + 装饰元素错位

**日期**: 2026-07-20  
**排查范围**: 段落末尾 Enter 产生分割线 / `::: divider` 和 `::: quote` 渲染到文档最前面  
**测试环境**: Node 22 + Vitest + JSDOM + Milkdown v7 实例  

---

## 一、排查结论速览

| 问题 | 根因定位 | 确信度 | 状态 |
|---|---|---|---|
| **Bug A**: 段落 Enter → 分割线 | **非 ProseMirror 内核问题**；最大嫌疑 = localStorage 旧数据残留 | 中 | 需浏览器验证 |
| **Bug B**: 装饰元素渲染到最前面 | **数据管线全链路正确**（serializer→unescape→regex→marked→HTML）；"欢迎语出现两次"暗示内容重复 | 中-高 | 需浏览器 console.log 验证 |

---

## 二、Bug A：段落末尾 Enter → 分割线格式

### 2.1 已排除的原因

| 假设 | 验证方法 | 结果 |
|---|---|---|
| ProseMirror `splitBlock` 把段落变成 HR？ | 纯 PM splitBlock 测试（`tests/prosemirror-splitblock.cjs`） | ❌ 段落 Enter → 段落，绝不会生成 HR |
| headingEnterFix 插件干扰了段落？ | 插件只拦截 `heading` 类型节点，`parent.type.name !== 'heading'` 直接 return false | ❌ 不影响段落 |
| commonmark 有隐藏的 HR input rule？ | Grep `@milkdown/kit` 和 `@milkdown/preset-commonmark` 全文搜索 `horizontal_rule/hrRule` | ❌ 无 HR 相关 input rule |
| buildHtml 把什么变成了 `<hr>`？ | buildHtml 正则只处理 `::: type`，不创建 hr | ❌ 无 |

### 2.2 最大嫌疑：localStorage 旧草稿残留

你提到："可能是之前某一个版本格式没有删除干净"。这非常关键。

**场景推演**：
1. 某个旧版本的 bug 或用户操作，在草稿中写入了大量 `---`（Markdown HR 语法）或 `\::: divider`（转义失败的指令）
2. 用户清除浏览器缓存或升级后，旧草稿仍在 `localStorage['podcast_draft']`
3. 页面加载时旧草稿被读入编辑器，其中包含一堆 HR/分割线元素
4. 用户看到的是**旧数据**，不是新产生的

### 2.3 建议操作

在浏览器控制台执行：
```js
// 查看当前草稿内容
JSON.parse(localStorage.getItem('podcast_draft')).slice(0, 500)

// 如果想清空重来：
localStorage.removeItem('podcast_draft')
// 然后刷新页面
```

如果清空后问题消失 → **确认为旧数据污染**。

如果清空后问题仍存在 → 请在控制台执行以下代码并给我输出：
```js
// 在编辑器里按一次 Enter 后立刻执行
const view = window.__debug_editor_view || 
  document.querySelector('.milkdown')?.__view;
if (view) {
  view.state.doc.forEach((n, o) => 
    console.log(`[${o}] ${n.type.name}: "${n.textContent.slice(0,50)}"`));
}
```

---

## 三、Bug B：装饰元素（divider/quote）渲染到文档最前面

### 3.1 已验证的全链路（全部正确 ✅）

我用 4 个测试覆盖了从 serializer 到最终 HTML 的完整管线：

```
Milkdown Editor Doc
  ↓ serializer
"\::: divider" (位置正确, 带 \ 转义)     ← B-1 ✅ 通过
  ↓ markdownUpdated 监听器 (line 1459)
"::: divider" (已还原转义, 位置不变)       ← 手动验证 OK
  ↓ buildHtml line 91-92 正则替换
<div data-decor="divider"></div> (位置正确) ← B-3 ✅ 通过
  ↓ marked.parse() line 94
<html>...<div data-decor> 在正确位置</html> ← 单元测试 OK
  ↓ post-process line 104
<style>※ ※ ※ [DIVIDER]</style> (位置正确)  ← 完整流模拟 ✅
```

**测试 B-1 结果**（序列化位置）：
```
#标题@0  第一段@6  divider@17  第二段@36   ✅ 顺序完全正确
```

**测试 B-2 结果**（复杂含 quote+divider 文档）：
```
# 欢迎@0  这里是@11  divider@34  ##正文@53  quote@70  更多@95   ✅ 顺序完全正确
```

**完整流模拟结果**：
```
✅ 欢迎使用 (h1): pos=0
✅ [DIVIDER]: pos=149
✅ 正文段落 (h2): pos=164
✅ [QUOTE]: pos=282
```

### 3.2 关键线索：截图中的"欢迎使用 净排"出现了两次

你提供的截图 2（右侧预览面板）中：

```
..........          ← 点点（可能是未渲染的 :: 文本）
欢迎使用 净排      ← 第 1 次
这里是你的第一篇...
..........          ← 更多点点
欢迎使用 净排      ← 第 2 次！！！
这里是你的第一篇...
..........
```

**同一内容出现两次 = 内容重复 bug，不是 CSS 错位。**

可能原因（按可能性排序）：

#### 🥇 可能性 1：DEFAULT_CONTENT 与用户内容合并重复

App.vue 初始化流程：
```js
// line 635: 默认值包含 "欢迎使用 净排"
const markdownText = ref(DEFAULT_CONTENT);

// line 664: 加载草稿（可能替换或不替换）
loadDraft_();

// line 1453: 编辑器用当前 markdownText 初始化
ctx.set(defaultValueCtx, markdownText.value);
```

如果用户的草稿**也包含了** "欢迎使用 净排"（因为他们在默认内容基础上编辑然后保存），而初始化时又用了 DEFAULT_CONTENT...不对，`loadDraft_()` 会覆盖。

但如果 `loadDraft_()` 的实现有边界条件（比如保存了空字符串，导致 `|| DEFAULT_CONTENT` 回退），就可能叠加。

#### 🥈 可能性 2：sync watch 循环导致追加而非替换

```js
// line 1389-1397: sync watch
watch(markdownText, (newMd) => {
  if (!isFromEditor && !isSettingEditor && milkdownEditor) {
    isSettingEditor = true;
    milkdownEditor.action(replaceAll(newMd));  // ← 应该是替换
    isSettingEditor = false;
  }
}, { flush: 'sync' });
```

如果 `isFromEditor`/`isSettingEditor` 标志位在某种竞态下同时为 false，sync watch 可能把 `markdownText` **再次推入编辑器**，造成内容追加。

#### 🥉 可能性 3：首屏 replaceAll 与后续 markdownUpdated 叠加

```js
// line 1481-1490: 首屏重渲染
if (/:::\s*(cover|divider|quote)/.test(markdownText.value)) {
  milkdownEditor.action(replaceAll(markdownText.value));
}
```

这次 `replaceAll` 触发 `markdownUpdated` → 更新 `markdownText` → 又触发 sync watch...正常应该被标志位拦住，但时序上可能有漏洞。

### 3.3 建议操作

在浏览器控制台执行以下诊断脚本（页面加载完成后）：

```js
// === 诊断 1: markdownText 是否有重复 ===
console.log('=== markdownText 前 300 字符 ===');
console.log(window.__vue_app__?._context.provides?.markdownText ?? 
  document.querySelector('.app-root')?.__vue_app__?.$data?.markdownText?.slice(0, 300));

// === 诊断 2: "欢迎使用 出现几次" ===
const md = /* 上面获取到的 markdownText */;
const matches = md.match(/欢迎使用/g);
console.log('"欢迎使用" 出现次数:', matches ? matches.length : 0);

// === 诊断 3: previewHtml 中 h1 数量 ===
const preview = document.querySelector('.phone-content');
if (preview) {
  const h1s = preview.querySelectorAll('h1');
  console.log('预览中 <h1> 数量:', h1s.length);
  h1s.forEach((h, i) => console.log(`  h1#${i}: "${h.textContent.trim()}"`));
}
```

---

## 四、修复建议（按优先级）

### 即时可做（无需代码修改）
1. **清除 localStorage 草稿** 后重新测试两个 bug
2. 如果清除后 Bug A 消失 → 确认为旧数据，考虑在 loadDraft 里加格式校验/迁移
3. 运行上面的诊断脚本，把输出给我

### 代码层面加固（建议实施）
1. **buildHtml 增加防御性处理**：对 `\:::` 转义做双重保险（已有 line 90，但可加日志 warn）
2. **sync watch 加防抖/去重**：检测到 newMd 与编辑器当前内容相同时跳过 replaceAll
3. **loadDraft 加格式校验**：如果检测到草稿中有裸露 `\:::` 或连续 `---`，提示用户或自动清理

### 需要进一步信息才能定位
- 浏览器控制台的诊断输出
- 清除缓存后是否复现
- 具体的复现步骤（是从空白开始写，还是在默认内容上编辑）

---

## 五、测试文件说明

| 文件 | 用途 | 状态 |
|---|---|---|
| `tests/appSync.test.js` | headingEnterFix 回归测试（4 项全绿） | ✅ 保留 |
| `tests/bugReproduce.test.js` | 本次排查用的 Bug A/B 复现测试（B-1/B-2/B-3 绿, A 因 jsdom 限制跳过） | ✅ 保留 |
