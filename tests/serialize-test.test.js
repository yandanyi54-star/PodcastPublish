// 序列化往返测试：观察 cover / divider / quote 在 Milkdown ↔ markdown ↔ buildHtml 链路中的真实形态
import { describe, it, expect } from 'vitest';
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

const { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx, listenerCtx } = await import('@milkdown/kit/core');
const { commonmark } = await import('@milkdown/kit/preset/commonmark');
const { gfm } = await import('@milkdown/kit/preset/gfm');
const { $nodeSchema, $remark, replaceAll } = await import('@milkdown/kit/utils');
const { Plugin, PluginKey, TextSelection } = await import('prosemirror-state');
const { listener } = await import('@milkdown/kit/plugin/listener');
const remarkDirectivePlugin = (await import('remark-directive')).default;
const remarkDirective = $remark('remarkDirective', () => remarkDirectivePlugin);

// 复制 App.vue 的 createDirectiveNode（与本仓库实现一致）
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
    if (type === 'cover') return ['div', { class: 'milkdown-decor-cover', 'data-decor-type': 'cover' }, ['h1', 0]];
    if (type === 'divider') return ['div', { class: 'milkdown-decor-divider', 'data-decor-type': 'divider' }, ['span', '※ ※ ※']];
    return ['section', { class: 'milkdown-decor-quote', 'data-decor-type': 'quote' }, 0];
  },
  parseDOM: [
    { tag: `div.milkdown-decor-${type}` },
    ...(type === 'quote' ? [{ tag: `section.milkdown-decor-${type}` }] : []),
  ],
}));

const coverDirective = createDirectiveNode('cover');
const dividerDirective = createDirectiveNode('divider');
const quoteDirective = createDirectiveNode('quote');

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
    .create();
  await new Promise(r => setTimeout(r, 300));
  return editor;
}

import { stripBareDirectives } from '../src/buildHtml.js';

// 模拟 buildHtml 的 ::: 预处理 + 看装饰元素是否被正确识别
function buildHtmlDecor(md) {
  md = stripBareDirectives(md);
  const decors = [...md.matchAll(/::: (\w+)\n([\s\S]*?)\n:::/g)].map(m => ({ type: m[1], content: m[2].trim() }));
  return decors;
}

// 复刻 App.vue markdownUpdated 的序列化后处理（含裸 ::: 剔除）
function normalizeMd(md) {
  return stripBareDirectives(md);
}

describe('装饰节点序列化形态观察', () => {
  it('观察 cover / divider / quote 序列化出的 markdown', async () => {
    const md = `# 标题

正文第一段。

::: cover
这是我的封面标题
:::

::: divider

:::

::: quote
这是一句金句
:::

正文第二段。`;

    const editor = await createEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));
    const serializer = editor.action(ctx => ctx.get(serializerCtx));

    const serialized = serializer(view.state.doc);
    console.log('=== Milkdown 序列化输出 ===');
    console.log(JSON.stringify(serialized));
    console.log('--- 可读 ---');
    console.log(serialized);

    console.log('\n=== buildHtml ::: 解析出的装饰 ===');
    const decors = buildHtmlDecor(serialized);
    decors.forEach(d => console.log(`  type=${d.type} | content="${d.content}"`));
    console.log('装饰总数:', decors.length);

    // 断言：序列化不应丢装饰、不应多装饰
    const types = decors.map(d => d.type);
    console.log('装饰类型序列:', JSON.stringify(types));
    expect(decors.length).toBe(3);
  });

  it('正常段落按 Enter 后序列化不应多出封面卡片', async () => {
    const md = `# 标题

正文第一段。

::: cover
这是我的封面标题
:::

正文第二段。`;

    const editor = await createEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));
    const serializer = editor.action(ctx => ctx.get(serializerCtx));

    // 光标移到"正文第一段"末尾，按 Enter
    const doc = view.state.doc;
    let paraEnd = null;
    doc.forEach((node, offset) => {
      if (node.type.name === 'paragraph' && node.textContent.includes('正文第一段')) {
        paraEnd = offset + 1; // 段落起始 pos+1 为该段落内容起始；用末尾
        const tr = view.state.tr;
        const end = offset + node.nodeSize - 1;
        tr.setSelection(TextSelection.create(doc, end, end));
        view.dispatch(tr);
      }
    });

    const event = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    view.someProp('handleKeyDown', f => f(view, event));
    await new Promise(r => setTimeout(r, 100));

    const after = serializer(view.state.doc);
    console.log('=== Enter 后序列化输出（原始）===');
    console.log(after);
    const normalized = normalizeMd(after);
    console.log('=== Enter 后序列化输出（归一化后）===');
    console.log(JSON.stringify(normalized));
    // artifact 特征：连续两个裸 :::（中间仅空白）。合法装饰的闭合 ::: 不与另一裸 ::: 相邻，不会命中。
    const barePairCount = (normalized.match(/\n[ \t]*:::[ \t]*\n[ \t]*:::[ \t]*\n/g) || []).length;
    console.log('归一化后裸 ::: 对(artifact)数量:', barePairCount);
    const decors = buildHtmlDecor(after);
    console.log('=== Enter 后装饰 ===');
    decors.forEach(d => console.log(`  type=${d.type} | content="${d.content}"`));
    console.log('装饰总数:', decors.length);
    expect(barePairCount).toBe(0); // 裸 ::: artifact 必须被剔除
    expect(decors.length).toBe(1); // 只应有原来的 1 个 cover（Enter 未新增装饰）
  });

  it('隔离：纯文档（无装饰）段落按 Enter 是否也冒裸 :::', async () => {
    const md = `# 标题

正文第一段。

正文第二段。`;

    const editor = await createEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));
    const serializer = editor.action(ctx => ctx.get(serializerCtx));

    const doc = view.state.doc;
    doc.forEach((node, offset) => {
      if (node.type.name === 'paragraph' && node.textContent.includes('正文第一段')) {
        const end = offset + node.nodeSize - 1;
        const tr = view.state.tr;
        tr.setSelection(TextSelection.create(doc, end, end));
        view.dispatch(tr);
      }
    });

    const event = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    view.someProp('handleKeyDown', f => f(view, event));
    await new Promise(r => setTimeout(r, 100));

    const after = serializer(view.state.doc);
    console.log('=== 纯文档 Enter 后序列化（原始）===');
    console.log(JSON.stringify(after));
    const normalized = normalizeMd(after);
    console.log('=== 纯文档 Enter 后序列化（归一化后）===');
    console.log(JSON.stringify(normalized));
    const barePairCount = (normalized.match(/\n[ \t]*:::[ \t]*\n[ \t]*:::[ \t]*\n/g) || []).length;
    console.log('归一化后裸 ::: 对(artifact)数量:', barePairCount);
    expect(barePairCount).toBe(0);
  });
});
