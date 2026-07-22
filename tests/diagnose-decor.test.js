/**
 * 诊断测试：集成完整 App.vue 配置（含 remark 插件 + markdownUpdated + stripBareDirectives），
 * 模拟「正文段落末尾按 Enter」后：
 *   1. markdownUpdated 收到的原始 md（是否含裸 :::）
 *   2. stripBareDirectives 后的 md
 *   3. ProseMirror 文档里是否有 decor 节点 ← 关键
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
const { history } = await import('@milkdown/plugin-history');
const remarkDirectivePlugin = (await import('remark-directive')).default;
const { stripBareDirectives } = await import('../src/buildHtml.js');

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

// ---------- 复刻 stripBareDirectiveRemark ----------
const stripBareDirectiveRemark = () => (tree) => {
  const children = tree.children || [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (
      node.type === 'containerDirective' &&
      (!node.name || typeof node.name !== 'string' || !node.name.trim())
    ) {
      node.type = 'paragraph';
      delete node.name;
      delete node.data?.directiveLabel;
    }
  }
};
const stripBareRemark = $remark('stripBareDirective', () => stripBareDirectiveRemark);

let isFromEditor = false;
let isSettingEditor = false;
let markdownText = '';

async function createEditor(markdown) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  console.log('\n========== 初始化编辑器 ==========');
  console.log('初始 markdown:');
  console.log(JSON.stringify(markdown));

  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, container);
      ctx.set(defaultValueCtx, markdown);
    })
    .use(listener)
    .use(remarkDirective)
    .use(stripBareRemark)
    .use(coverDirective)
    .use(dividerDirective)
    .use(quoteDirective)
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(headingEnterFixPlugin)
    .create();

  await new Promise(r => setTimeout(r, 400));

  if (/:::\s*(cover|divider|quote)/.test(markdown)) {
    isSettingEditor = true;
    editor.action(replaceAll(markdown));
    isSettingEditor = false;
    await new Promise(r => setTimeout(r, 300));
  }

  return { editor, container };
}

function pressEnter(view) {
  const event = new window.KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true });
  return view.someProp('handleKeyDown', f => f(view, event));
}

function dumpDoc(view) {
  const doc = view.state.doc;
  const nodes = [];
  doc.forEach((node) => {
    nodes.push({ type: node.type.name, text: node.textContent.slice(0, 30) });
  });
  const decorCount = nodes.filter(n => n.type === 'cover' || n.type === 'divider' || n.type === 'quote').length;
  console.log('\n[ProseMirror 文档结构]');
  nodes.forEach((n, i) => console.log(`  [${i}] ${n.type}: "${n.text}"`));
  console.log('[decor 节点数]:', decorCount);
  return { doc, nodes, decorCount };
}

describe('诊断：按 Enter 后编辑器 decor 节点', () => {
  it('正文段落末尾按 Enter → 检查 ProseMirror 文档', async () => {
    const md = `# 标题

这是正文第一段。`;

    const { editor } = await createEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));

    console.log('\n========== 按 Enter 前 ==========');
    let dump = dumpDoc(view);
    expect(dump.decorCount).toBe(0);

    // 把光标放到段落末尾
    const doc = view.state.doc;
    const para = doc.child(1);
    const endPos = doc.child(0).nodeSize + 1 + para.content.size - 1;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, endPos)));

    console.log('\n========== 模拟按 Enter ==========');
    pressEnter(view);
    await new Promise(r => setTimeout(r, 200));

    console.log('\n========== 按 Enter 后 ==========');
    dump = dumpDoc(view);

    console.log('\n[诊断结论] decorCount =', dump.decorCount);
  });

  it('含裸 ::: 的 markdown 初始化 → 是否产生 decor 节点', async () => {
    // 模拟空段落序列化产生的裸 ::: 对
    const md = `# 标题

这是正文第一段。

:::

:::

第二段正文。`;

    console.log('\n========== 含裸 ::: 初始化 ==========');
    console.log('初始 markdown:');
    console.log(JSON.stringify(md));

    const { editor } = await createEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));
    const dump = dumpDoc(view);

    console.log('\n[诊断结论] 裸 ::: 初始化后 decorCount =', dump.decorCount);
    // 观察：remark 插件是否拦截了裸 :::（期望 decorCount=0）
  });

  it('纯文档含合法 cover 块初始化 → cover 节点是否正确保留', async () => {
    const md = `# 标题

正文。

::: cover
点击编辑文字
:::

第二段。`;

    console.log('\n========== 含合法 cover 初始化 ==========');
    const { editor } = await createEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));
    const dump = dumpDoc(view);
    console.log('\n[诊断结论] cover 初始化后 decorCount =', dump.decorCount);
    const hasCover = dump.nodes.some(n => n.type === 'cover');
    console.log('[是否含 cover 节点]:', hasCover);
  });
});
