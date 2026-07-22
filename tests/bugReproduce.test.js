/**
 * 排查两项 bug 的复现测试：
 *   Bug A: 段落末尾 Enter → 产生分割线/HR
 *   Bug B: ::: divider / ::: quote 渲染错位到文档最前面
 *
 * 测试策略：
 *   1. 用含 :: directive 的文档初始化编辑器
 *   2. 检查序列化后的 markdown 中 ::: 是否在正确位置
 *   3. 在段落末尾按 Enter，检查新节点类型
 *   4. 模拟 buildHtml 的 ::: 正则替换 + marked.parse，检查输出 HTML 结构
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="editor"></div></body></html>', {
  pretendToBeVisual: true, url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.addEventListener = dom.window.addEventListener.bind(dom.window);
globalThis.removeEventListener = dom.window.removeEventListener.bind(dom.window);
globalThis.dispatchEvent = dom.window.dispatchEvent.bind(dom.window);
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;

const { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx, listenerCtx } = await import('@milkdown/kit/core');
const { commonmark } = await import('@milkdown/kit/preset/commonmark');
const { gfm } = await import('@milkdown/kit/preset/gfm');
const { replaceAll, $nodeSchema, $remark, $prose } = await import('@milkdown/kit/utils');
const { Plugin, PluginKey, TextSelection } = await import('prosemirror-state');
const { listener } = await import('@milkdown/kit/plugin/listener');
const remarkDirectivePlugin = (await import('remark-directive')).default;

// ---------- 复刻 headingEnterFix（修复后版本）----------
const headingEnterFixPlugin = $prose(() => new Plugin({
  key: new PluginKey('headingEnterFix'),
  props: {
    handleKeyDown(view, event) {
      if (event.key !== 'Enter') return false;
      if (event.shiftKey || event.ctrlKey || event.metaKey) return false;
      const { state, dispatch } = view;
      const { selection, schema } = state;
      const { $head, empty } = selection;
      if (!empty) return false;
      const parent = $head.parent;
      if (parent.type.name !== 'heading') return false;
      if ($head.parentOffset < parent.content.size) return false;
      const afterPos = $head.after($head.depth);
      const tr = state.tr;
      tr.insert(afterPos, schema.nodes.paragraph.create());
      tr.setSelection(TextSelection.create(tr.doc, afterPos + 1));
      dispatch(tr);
      return true;
    },
  },
}));

// ---------- 复刻装饰节点 schema（与 App.vue 一致）----------
const createDirectiveNode = (type) => $nodeSchema(type, () => ({
  content: type === 'divider' ? '' : 'text*',
  group: 'block',
  defining: true,
  isolating: true,
  attrs: { type: { default: type } },
  parseMarkdown: {
    match: (node) => node.type === 'containerDirective' && node.name === type,
    runner: (state, node, nodeType) => {
      const text = node.children?.map(c => c.value || '').join('') || '';
      state.openNode(nodeType, { type });
      if (type !== 'divider' && text) state.addText(text);
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (n) => n.type.name === type,
    runner: (state, node) => {
      state.openNode('containerDirective', { name: type });
      if (type !== 'divider') {
        state.next(node.content);
      }
      state.closeNode();
    },
  },
  toDOM: () => {
    if (type === 'cover') return ['div', { class: `milkdown-decor-${type}`, 'data-decor-type': type }, ['h1', 0]];
    if (type === 'divider') return ['div', { class: `milkdown-decor-${type}`, 'data-decor-type': type }, ['span', '※']];
    return ['section', { class: `milkdown-decor-${type}`, 'data-decor-type': type }, 0];
  },
  parseDOM: [{ tag: `div.milkdown-decor-${type}` }],
}));

const coverDirective = createDirectiveNode('cover');
const dividerDirective = createDirectiveNode('divider');
const quoteDirective = createDirectiveNode('quote');

const remarkDirective = $remark('remarkDirective', () => remarkDirectivePlugin);

// ---------- 辅助：创建编辑器 ----------
async function createEditor(markdown) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, container);
      ctx.set(defaultValueCtx, markdown);
    })
    .use(listener)
    .use(remarkDirective)
    .use(coverDirective)
    .use(dividerDirective)
    .use(quoteDirective)
    .use(commonmark)
    .use(gfm)
    .use((await import('@milkdown/plugin-history')).history)
    .use(headingEnterFixPlugin)
    .create();

  await new Promise(r => setTimeout(r, 400));

  // 含 ::: 时做一次 replaceAll
  if (/:::\s*(cover|divider|quote)/.test(markdown)) {
    editor.action(replaceAll(markdown));
    await new Promise(r => setTimeout(r, 300));
  }

  // 用 serializer 获取当前文档的 markdown
  const getMd = () => {
    try {
      return editor.action(ctx => {
        const ser = ctx.get(serializerCtx);
        const view = ctx.get(editorViewCtx);
        return ser(view.state.doc);
      });
    } catch(e) { return null; }
  };

  return { editor, container, getMd };
}

function pressEnter(view) {
  const event = new window.KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true });
  return view.someProp('handleKeyDown', f => f(view, event));
}

// ========== 测试 ==========

describe('Bug 排查：Enter 行为 + 装饰元素渲染', () => {

  it('Bug B-1: 序列化后 ::: divider 的位置是否正确', async () => {
    const md = `# 标题

第一段正文内容。

::: divider

:::

第二段正文内容。`;

    const { getMd } = await createEditor(md);
    const serialized = getMd() || '';

    console.log('[B-1] 序列化结果:');
    console.log(serialized || '(empty)');
    console.log('---END---');

    const titleIdx = serialized.indexOf('# 标题');
    const firstParaIdx = serialized.indexOf('第一段');
    const dividerIdx = serialized.indexOf('::: divider');
    const secondParaIdx = serialized.indexOf('第二段');

    console.log(`[B-1] #标题@${titleIdx} 第一段@${firstParaIdx} divider@${dividerIdx} 第二段@${secondParaIdx}`);

    expect(serialized).toBeTruthy();
    expect(dividerIdx).toBeGreaterThan(firstParaIdx);
    expect(dividerIdx).toBeLessThan(secondParaIdx);
    expect(dividerIdx).toBeGreaterThan(titleIdx);
  });

  it('Bug B-2: 含 quote+divider 的复杂文档序列化顺序', async () => {
    const md = `# 欢迎使用 净排

这里是你的第一篇公众号推文。

详细总结

::: divider

:::

## 正文段落

一些内容。

::: quote
这是一句金句文字
:::

更多正文。`;

    const { getMd } = await createEditor(md);
    const serialized = getMd() || '';

    console.log('[B-2] 复杂文档序列化:');
    console.log(serialized || '(empty)');
    console.log('---END---');

    const parts = [
      { name: '# 欢迎', re: /# 欢迎使用/ },
      { name: '这里是', re: /这里是你的/ },
      { name: '::: divider', re: /:::\s*divider/ },
      { name: '## 正文', re: /## 正文段落/ },
      { name: '::: quote', re: /:::\s*quote/ },
      { name: '更多正文', re: /更多正文/ },
    ];

    let lastPos = 0;
    for (const part of parts) {
      const m = serialized.match(part.re);
      const pos = m ? m.index : -1;
      console.log(`[B-2] ${part.name}: pos=${pos}`);
      expect(pos).toBeGreaterThanOrEqual(lastPos);
      lastPos = pos >= 0 ? pos : 999999;
    }
  });

  it('Bug A: 段落末尾按 Enter 后新节点为段落（非 HR/分割线）', async () => {
    const md = `# 标题

这是正文第一段。`;

    const { editor } = await createEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));
    const doc = view.state.doc;

    // heading(0) + paragraph(1)：把光标放到段落末尾
    const para = doc.child(1);
    const endPos = doc.child(0).nodeSize + 1 + para.content.size - 1;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, endPos)));

    const beforeCount = doc.childCount;
    console.log('[A] Enter 前 childCount:', beforeCount);

    pressEnter(view);
    await new Promise(r => setTimeout(r, 100));

    const newDoc = view.state.doc;
    console.log('[A] Enter 后结构:');
    newDoc.forEach((node, offset) => {
      console.log(`  [${offset}] ${node.type.name}: "${node.textContent.slice(0, 40)}"`);
    });

    // 文档应增加一个子节点，且最后一个（splitBlock 新建的）是 paragraph，绝不能是 hr
    expect(newDoc.childCount).toBe(beforeCount + 1);
    expect(newDoc.lastChild.type.name).toBe('paragraph');
    expect(newDoc.lastChild.type.name).not.toBe('horizontal_rule');
  });

  it('Bug B-3: buildHtml 的 ::: 正则替换逻辑验证', async () => {
    const md = `# 标题

第一段。

::: divider

:::

第二段。`;

    let processed = md.replace(/\\(:::[^\n]*)/g, '$1');
    processed = processed.replace(/::: (\w+)\n([\s\S]*?)\n:::/g, (_, type, content) =>
      `<div data-decor="${type}">${content.trim()}</div>`);

    console.log('[B-3] 正则替换后:');
    console.log(processed);

    const titleIdx = processed.indexOf('# 标题');
    const firstParaIdx = processed.indexOf('第一段');
    const decorIdx = processed.indexOf('data-decor');
    const secondParaIdx = processed.indexOf('第二段');

    console.log(`[B-3] #标题@${titleIdx} 第一段@${firstParaIdx} decor@${decorIdx} 第二段@${secondParaIdx}`);

    expect(decorIdx).toBeGreaterThan(firstParaIdx);
    expect(decorIdx).toBeLessThan(secondParaIdx);
  });

  it('REGRESSION: 金句卡片(quote)序列化不得抛 addText is not a function', async () => {
    const md = `# 标题

一段正文。

::: quote
点击编辑文字
:::

更多正文。`;

    const { getMd } = await createEditor(md);
    let serialized = null;
    let threw = null;
    try {
      serialized = getMd();
    } catch (e) {
      threw = e;
    }

    console.log('[REG-quote] 序列化结果:');
    console.log(serialized || '(empty)');
    console.log('[REG-quote] 是否抛错:', threw ? threw.message : '否');

    expect(threw).toBeNull();
    expect(serialized).toContain('::: quote');
    expect(serialized).toContain('点击编辑文字');
    // 位置正确：quote 在「更多正文」之前、在「一段正文」之后
    expect(serialized.indexOf('::: quote')).toBeGreaterThan(serialized.indexOf('一段正文'));
    expect(serialized.indexOf('::: quote')).toBeLessThan(serialized.indexOf('更多正文'));
  });

  it('REGRESSION: 封面卡片(cover)序列化不得抛 addText is not a function', async () => {
    const md = `# 标题

::: cover
点击编辑文字
:::

正文段落。`;

    const { getMd } = await createEditor(md);
    let serialized = null;
    let threw = null;
    try {
      serialized = getMd();
    } catch (e) {
      threw = e;
    }

    console.log('[REG-cover] 序列化结果:');
    console.log(serialized || '(empty)');
    console.log('[REG-cover] 是否抛错:', threw ? threw.message : '否');

    expect(threw).toBeNull();
    expect(serialized).toContain('::: cover');
    expect(serialized).toContain('点击编辑文字');
  });
});
