// 编辑器解析入口回归测试：确保「裸 :::」在进入 Milkdown 解析器前被剥离，
// 避免其与草稿里可能的 ::: cover 占位块错位、被 remark-directive 误判成封面卡片节点。
// 复刻诊断日志中的真实场景（rawMd 同时含裸 ::: 与转义的 \::: cover 占位块）。
import { describe, it, expect } from 'vitest';
import { stripBareDirectives } from '../src/buildHtml.js';

describe('编辑器解析入口：裸 ::: 必须在解析前清除', () => {
  it('裸 ::: 与转义 \::: cover 占位块共存时，种子块被中和、裸 ::: 被剔除、内容释放为纯文本', () => {
    // 来自诊断日志：正文空段落序列化出裸 :::，末尾是转义的欢迎占位块（默认占位种子）
    const rawMd =
      '# 欢迎使用 净排\n\n这里是你的第一篇公众号推文。\n\n:::\n111\n:::\n\n' +
      '## 它能帮你做什么\n\n* 用 Markdown 写\n\n开始写点什么吧 ✍️\n\n\\::: cover\n点击编辑文字\n\\:::';

    const clean = stripBareDirectives(rawMd);

    // 默认占位种子块 ::: cover\n点击编辑文字\n::: 必须被中和（不再保留为封面节点）。
    // 这是 Bug A 的 misparse 种子，与裸 ::: 相邻会被 remark-directive 误判成真 cover。
    expect(/::: cover/.test(clean)).toBe(false);
    // 裸 ::: artifact（空段落序列化）必须被剔除
    const bareCount = (clean.match(/^[ \t]*:::[ \t]*$/gm) || []).length;
    expect(bareCount).toBe(0);
    // 内容「111」从匿名容器释放成普通文本
    expect(clean).toContain('111');
  });

  it('真实内容的 ::: cover 不被中和（区别于默认占位种子）', () => {
    const md = '# 标题\n\n::: cover\n这是我的封面标题\n:::\n\n正文。';
    const clean = stripBareDirectives(md);
    expect(clean).toContain('::: cover');
    expect(clean).toContain('这是我的封面标题');
  });

  it('纯文档连续按 Enter 不应残留任何孤儿裸 :::', () => {
    const rawMd = '# 标题\n\n正文第一段。\n\n:::\n:::\n\n:::\n:::\n\n正文第二段。';
    const clean = stripBareDirectives(rawMd);
    const bareCount = (clean.match(/^[ \t]*:::[ \t]*$/gm) || []).length;
    const namedCount = (clean.match(/^[ \t]*:::\s+\w+/gm) || []).length;
    expect(bareCount).toBe(namedCount); // 0 === 0，无孤儿裸 :::
    expect(clean).toContain('正文第一段。');
    expect(clean).toContain('正文第二段。');
  });

  it('合法 ::: divider / quote 不受影响', () => {
    const md = '正文。\n\n::: divider\n\n::: quote\n金句内容\n:::';
    const clean = stripBareDirectives(md);
    expect(clean).toContain('::: divider');
    expect(clean).toContain('::: quote');
    expect(clean).toContain('金句内容');
  });
});
