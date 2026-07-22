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

const { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx, listenerCtx } = await import('@milkdown/kit/core');
const { commonmark } = await import('@milkdown/kit/preset/commonmark');
const { gfm } = await import('@milkdown/kit/preset/gfm');
const { history } = await import('@milkdown/kit/plugin/history');
const { $nodeSchema, $remark } = await import('@milkdown/kit/utils');
const { listener } = await import('@milkdown/kit/plugin/listener');
const remarkDirectivePlugin = (await import('remark-directive')).default;
const remarkDirective = $remark('remarkDirective', () => remarkDirectivePlugin);

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
      if (type !== 'divider') state.next(node.content);
      state.closeNode();
    },
  },
  toDOM: () => {
    if (type === 'cover') return ['div', { class: 'milkdown-decor-cover' }, ['h1', 0]];
    return ['div', { class: 'milkdown-decor-divider' }, 0];
  },
  parseDOM: [{ tag: `div.milkdown-decor-${type}` }],
}));

const coverDirective = createDirectiveNode('cover');

const mkEditor = async (markdown) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let editor;
  await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, container);
      ctx.set(defaultValueCtx, markdown);
    })
    .use(listener)
    .use(remarkDirective)
    .use(coverDirective)
    .use(commonmark)
    .use(gfm)
    .use(history)
    .create()
    .then(e => { editor = e; });
  return editor;
};

describe('probe: cover 节点序列化形态', () => {
  it('含 ::: cover 的 markdown 初始化，序列化后是什么', async () => {
    const md = '# 标题\n\n正文段落。\n\n::: cover\n你好世界\n:::\n\n## 小标题';
    const editor = await mkEditor(md);
    const view = editor.action(ctx => ctx.get(editorViewCtx));
    const serializer = editor.action(ctx => ctx.get(serializerCtx));

    const types = [];
    view.state.doc.forEach(n => types.push(n.type.name + (n.textContent ? ':' + JSON.stringify(n.textContent.slice(0,10)) : '')));
    console.log('doc 节点:', JSON.stringify(types));

    const out = serializer(view.state.doc);
    console.log('序列化输出:', JSON.stringify(out));
    console.log('--- 渲染 ---');
    console.log(out);
    console.log('包含 "::: cover":', /::: cover/.test(out));
    console.log('包含 裸 ":::" (无名字):', /^[ \t]*:::[ \t]*$/m.test(out));
  });
});
