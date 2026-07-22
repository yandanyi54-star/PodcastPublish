/**
 * headingEnterFix — 标题末尾 Enter 行为修正插件
 *
 * 默认行为：ProseMirror 在标题（H1/H2/H3）末尾按 Enter 会继承同级别标题。
 * 修正后：标题末尾按 Enter 创建普通段落（paragraph），符合"写完标题→写正文"直觉。
 *
 * 不影响：
 *   - 标题中间按 Enter（正常拆成两个同级标题）
 *   - 列表 / 引用 / 代码块 / 正文 的 Enter
 *   - Shift+Enter 软换行
 */

import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { $prose } from '@milkdown/kit/utils';

export const headingEnterFix = $prose(
  () =>
    new Plugin({
      key: new PluginKey('headingEnterFix'),

      props: {
        handleKeyDown(view, event) {
          if (event.key !== 'Enter') return false;
          if (event.shiftKey || event.ctrlKey || event.metaKey) return false;

          const { state, dispatch } = view;
          const { selection, schema } = state;
          const { $head, empty } = selection;

          // 有选区时走默认 splitBlock（替换选区 + 拆分）
          if (!empty) return false;

          const parent = $head.parent;

          // 只处理 heading 节点
          if (parent.type.name !== 'heading') return false;

          // 光标不在标题末尾时走默认 splitBlock（拆成两个同级标题）
          if ($head.parentOffset < parent.content.size) return false;

          // 标题末尾 → 在标题下方创建新段落
          // 注意：$head.depth 是标题节点自身的深度（顶层标题为 1），
          // after($head.depth) 取到"标题节点之后"的位置；
          // 用 after($head.depth - 1) 会取到文档根节点之后，对顶层标题非法 → 抛异常。
          const afterPos = $head.after($head.depth);

          const tr = state.tr;
          tr.insert(afterPos, schema.nodes.paragraph.create());
          tr.setSelection(TextSelection.create(tr.doc, afterPos + 1));
          dispatch(tr);
          return true;
        },
      },
    }),
);
