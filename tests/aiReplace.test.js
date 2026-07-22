/**
 * #3 修复验证：AI「选中替换」改用文档级区间替换（replaceRange），
 * 不再用 markdownText.indexOf(sel) 做字符串手术——后者在选区跨块（标题+段落）
 * 时序列化不一致，频繁返回 -1 导致静默失败 + 假成功。
 *
 * 复刻 App.vue 的 replaceSelectedWith 逻辑（milkdownEditor + replaceRange），
 * 在真实 Milkdown 编辑器（jsdom）下验证：跨块选区替换成功、旧文本消失、标题保留。
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
const { replaceAll, replaceRange, $nodeSchema, $remark } = await import('@milkdown/kit/utils');
const { history } = await import('@milkdown/plugin-history');
const { listener, listenerCtx } = await import('@milkdown/kit/plugin/listener');
const { TextSelection } = await import('prosemirror-state');
const remarkDirectivePlugin = (await import('remark-directive')).default;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let isSettingEditor = false;
let milkdownEditor = null;
// 同步读取当前文档 markdown（不依赖异步 listener，断言更稳）
const getMd = () => milkdownEditor.action((ctx) =>
  ctx.get(serializerCtx)(ctx.get(editorViewCtx).state.doc));

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

// 复刻 App.vue replaceSelectedWith（#3 修复后）
const replaceSelectedWith = (replacement) => {
  if (!milkdownEditor) return false;
  try {
    return milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { from, to, empty } = view.state.selection;
      if (empty) return false;
      replaceRange(replacement, { from, to })(ctx);
      return true;
    });
  } catch (_) {
    return false;
  }
};

const INITIAL = '# 标题\n\n第一段需要扩写的内容。\n\n第二段也需要被替换掉。';

describe('AI 选中替换（#3 文档级区间替换）', () => {
  let view;
  beforeAll(async () => {
    milkdownEditor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, document.getElementById('editor'));
        ctx.set(defaultValueCtx, INITIAL);
        ctx.get(listenerCtx).markdownUpdated(() => { /* 仅占位，断言用 getMd 同步读取 */ });
      })
      .use(listener).use(remarkDirective)
      .use(coverDirective).use(dividerDirective).use(quoteDirective)
      .use(commonmark).use(gfm).use(history)
      .create();
    view = milkdownEditor.action((ctx) => ctx.get(editorViewCtx));
  }, 25000);

  it('选区为空时返回 false（调用方据此弹错误而非假成功）', () => {
    // 折叠光标（empty 选区）落在标题内的合法内联位置
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));
    expect(replaceSelectedWith('任意内容')).toBe(false);
  });

  it('跨块选区（两个段落）替换成功，旧文本消失，标题保留', async () => {
    const doc = view.state.doc;
    // 选区从正文第 1 段内部一直拉到末段落内部——跨块场景正是 indexOf 序列化不一致失手处
    const from = doc.child(0).nodeSize + 1; // 跳过标题，从首段内部开始
    const to = doc.content.size - 1; // 末段落内部
    view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, from, to)));

    const before = getMd();
    expect(before).toContain('第一段需要扩写的内容');
    expect(before).toContain('标题');

    const ok = replaceSelectedWith('这是 AI 替换后的全新内容。');
    await sleep(40);
    const after = getMd();

    expect(ok).toBe(true);
    expect(after).not.toContain('第一段需要扩写的内容');
    expect(after).not.toContain('第二段也需要被替换掉');
    expect(after).toContain('这是 AI 替换后的全新内容');
    expect(after).toContain('标题'); // 标题在选区外，应保留
  });

  it('单行内选区替换成功', async () => {
    // 重新载入干净文档
    isSettingEditor = true;
    milkdownEditor.action(replaceAll('# 新标题\n\n只有这一段文字要替换。'));
    isSettingEditor = false;
    await sleep(40);

    const md = getMd();
    const doc = view.state.doc;
    const pStart = doc.child(0).nodeSize; // 段落起始位置
    const text = '只有这一段文字要替换';
    const idxInMd = md.indexOf(text);
    expect(idxInMd).toBeGreaterThan(-1);
    const from = pStart + 1 + text.indexOf('要替换');
    const to = pStart + 1 + text.length;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, from, to)));

    const ok = replaceSelectedWith('已改写');
    await sleep(40);
    const after = getMd();
    expect(ok).toBe(true);
    expect(after).toContain('只有这一段文字已改写。');
    expect(after).not.toContain('要替换');
  });
});
