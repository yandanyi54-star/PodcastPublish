/**
 * forceParagraphEnter — 根治「按 Enter 凭空插入 cover 节点」的 bug。
 *
 * 根因：装饰节点 cover/quote 是 schema 中排在最前的 textblock（因 remarkDirective + 装饰节点
 * 必须注册在 commonmark 之前，`:::` 才能被解析为容器节点）。于是 ProseMirror splitBlock 的
 * defaultBlockAt() 把「新段落」类型解析成了 cover，导致在普通段落末尾按 Enter 会插入一个空 cover
 * 节点（渲染成幽灵封面卡片；序列化后又被 stripBareDirectives 清除，所以预览/刷新后消失）。
 *
 * 修复：在普通文本块（段落）按 Enter 时，强制以 paragraph 作为 split 产生的新块类型，
 * 绕开 defaultBlockAt 的误判。标题/列表/代码块交给 Milkdown 各自的默认处理器，不受影响。
 */
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { canSplit } from 'prosemirror-transform';
import { $prose } from '@milkdown/kit/utils';

export const forceParagraphEnter = $prose(
  () =>
    new Plugin({
      key: new PluginKey('forceParagraphEnter'),
      props: {
        handleKeyDown(view, event) {
          if (event.key !== 'Enter') return false;
          if (event.shiftKey || event.metaKey || event.ctrlKey) return false;
          const { state } = view;
          const { selection } = state;
          if (!(selection instanceof TextSelection)) return false;
          const { $from } = selection;
          if (!$from.depth) return false;

          const parentType = $from.parent.type.name;
          // 标题：交给 headingEnterFix 处理
          if (parentType === 'heading' || parentType === 'code_block') return false;
          // 列表环境：交给 Milkdown 的 listItem keymap（splitListItem）
          for (let d = $from.depth; d > 0; d--) {
            const n = $from.node(d);
            if (
              n &&
              (n.type.name === 'list_item' ||
                n.type.name === 'bullet_list' ||
                n.type.name === 'ordered_list')
            ) {
              return false;
            }
          }

          const paragraph = state.schema.nodes.paragraph;
          if (!paragraph) return false;

          // 构造与 prosemirror-commands splitBlock 一致的 split 类型，但强制新块为 paragraph
          const types = [];
          for (let d = $from.depth; ; d--) {
            const node = $from.node(d);
            if (node.isBlock) {
              types.unshift({ type: paragraph });
              break;
            }
            if (d === 1) return false;
            types.unshift(null);
          }

          const tr = state.tr;
          if (!selection.empty) tr.deleteSelection();
          const splitPos = tr.mapping.map($from.pos);
          if (!canSplit(tr.doc, splitPos, types.length, types)) return false;
          tr.split(splitPos, types.length, types);
          view.dispatch(tr.scrollIntoView());
          return true;
        },
      },
    }),
);
