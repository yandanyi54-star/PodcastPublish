/**
 * 完整复刻 App.vue 的 Markdown 双向同步回路，定位 Enter→H1 的真正根因。
 * 包含：directive 节点 + headingEnterFix + markdownUpdated 监听器 + sync watch(replaceAll)
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

const { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx } = await import('@milkdown/kit/core');
const { commonmark } = await import('@milkdown/kit/preset/commonmark');
const { gfm } = await import('@milkdown/kit/preset/gfm');
const { replaceAll, $nodeSchema, $remark, $prose } = await import('@milkdown/kit/utils');
const { history } = await import('@milkdown/plugin-history');
const { listener, listenerCtx } = await import('@milkdown/kit/plugin/listener');
const { TextSelection } = await import('prosemirror-state');
const remarkDirectivePlugin = (await import('remark-directive')).default;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===== 复刻 App.vue 同步状态 =====
let markdownText = '';
let isFromEditor = false;
let isSettingEditor = false;
let milkdownEditor = null;

const remarkDirective = $remark('remarkDirective', () => remarkDirectivePlugin);

const createDirectiveNode = (type) => $nodeSchema(type, () => ({
  content: type === 'divider' ? '' : 'text*',
  group: 'block', defining: true, isolating: true,
  attrs: { type: { default: type } },
  parseMarkdown: { match: (n) => n.type === 'containerDirective' && n.name === type,
    runner: (state, node, nodeType) => { const text = node.children?.map(c => c.value || '').join('') || ''; state.openNode(nodeType, { type }); if (type !== 'divider' && text) state.addText(text); state.closeNode(); } },
  toMarkdown: { match: (n) => n.type.name === type, runner: (state, node) => { state.openNode('containerDirective', { name: type }); if (type !== 'divider') { state.openNode('paragraph'); state.addText(node.textContent || ''); state.closeNode(); } state.closeNode(); } },
  toDOM: () => ['div', { class: 'milkdown-decor-' + type }, 0],
  parseDOM: [{ tag: `div.milkdown-decor-${type}` }],
}));
const coverDirective = createDirectiveNode('cover');
const dividerDirective = createDirectiveNode('divider');
const quoteDirective = createDirectiveNode('quote');

// ===== 复刻 headingEnterFix =====
import { Plugin, PluginKey } from 'prosemirror-state';
const headingEnterFix = (() => {
  return $prose(() => new Plugin({
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
})();

// ===== 复刻 sync watch（flush: sync）=====
function runSyncWatch() {
  if (!isFromEditor && !isSettingEditor && milkdownEditor) {
    isSettingEditor = true;
    milkdownEditor.action(replaceAll(markdownText));
    isSettingEditor = false;
  }
}

describe('App 同步回路复现', () => {
  let view;
  beforeAll(async () => {
    milkdownEditor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, document.getElementById('editor'));
        ctx.set(defaultValueCtx, '# 标题\n\n这是正文第一段。');
        ctx.get(listenerCtx).markdownUpdated((_, md) => {
          if (isSettingEditor) return;
          md = md.replace(/\\(:::[^\n]*)/g, '$1');
          isFromEditor = true;
          markdownText = md;
          runSyncWatch(); // 复刻 flush:'sync' watch（在 isFromEditor 仍为真时执行）
          isFromEditor = false;
        });
      })
      .use(listener).use(remarkDirective)
      .use(coverDirective).use(dividerDirective).use(quoteDirective)
      .use(commonmark).use(gfm).use(history).use(headingEnterFix)
      .create();
    view = milkdownEditor.action((ctx) => ctx.get(editorViewCtx));
  }, 25000);

  function pressEnter({ shift = false, ctrl = false } = {}) {
    const event = new dom.window.KeyboardEvent('keydown', { key: 'Enter', shiftKey: shift, ctrlKey: ctrl, bubbles: true, cancelable: true });
    return view.someProp('handleKeyDown', (f) => f(view, event));
  }
  function countType(doc, t) { let n = 0; doc.forEach((c) => { if (c.type.name === t) n++; }); return n; }

  it('初始结构', () => {
    expect(view.state.doc.childCount).toBe(2);
    expect(view.state.doc.child(0).type.name).toBe('heading');
  });

  it('正文段落末尾按 Enter → 期望仍是段落（不变成 H1）', async () => {
    const headingSize = view.state.doc.child(0).nodeSize;
    const para = view.state.doc.child(1);
    const endPos = headingSize + para.content.size;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, endPos)));

    await pressEnter();
    await sleep(60);

    const after = view.state.doc;
    const lastNode = after.child(after.childCount - 1);
    console.log('[段落Enter] 子节点数:', after.childCount, '末节点:', lastNode.type.name);
    console.log('[段落Enter] markdownText:', JSON.stringify(markdownText));
    console.log('[段落Enter] heading 数:', countType(after, 'heading'));
    expect(lastNode.type.name).not.toBe('heading');
    expect(countType(after, 'heading')).toBe(1); // 不应新增 heading
  });

  it('H1 末尾按 Enter → 期望变成段落', async () => {
    // 在 H1 末尾放光标
    const h1size = view.state.doc.child(0).nodeSize;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, h1size - 1)));
    const beforeParas = countType(view.state.doc, 'paragraph');

    await pressEnter();
    await sleep(60);

    const after = view.state.doc;
    console.log('[H1末尾Enter] 子节点数:', after.childCount, 'heading 数:', countType(after, 'heading'));
    console.log('[H1末尾Enter] markdownText:', JSON.stringify(markdownText));
    // headingEnterFix 应使 H1 末尾 Enter 生成段落（heading 数不变，段落+1）
    expect(countType(after, 'heading')).toBe(1);
    expect(countType(after, 'paragraph')).toBe(beforeParas + 1);
  });

  it('H1 中间按 Enter → 期望拆成两个 H1', async () => {
    const midPos = 1 + Math.floor(view.state.doc.child(0).content.size / 2);
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, midPos)));
    const before = countType(view.state.doc, 'heading');

    await pressEnter();
    await sleep(60);

    const after = view.state.doc;
    console.log('[H1中间Enter] heading 数:', countType(after, 'heading'), '(期望', before + 1, ')');
    console.log('[H1中间Enter] markdownText:', JSON.stringify(markdownText));
    expect(countType(after, 'heading')).toBe(before + 1);
  });
});
