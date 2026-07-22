/**
 * buildHtml 核心排版管线测试
 *
 * 注意：buildHtml() 已提取到 src/buildHtml.js，THEMES 已提取到 src/themes.js。
 * 测试前请确保依赖已安装：npm install
 */

import { describe, it, expect } from 'vitest';
import { buildHtml, stripBareDirectives } from '../src/buildHtml.js';
import { THEMES } from '../src/themes.js';

// ============================================================
// 行为契约
// ============================================================
//
// buildHtml(md, theme, overrides, brand) → string (HTML)
//
// 参数:
//   md       - Markdown 源文本
//   theme    - 主题 key（如 'serif_news'），默认兜底为 serif_news
//   overrides - 用户自定义覆盖（可选）
//   brand    - 品牌色配置（可选）{ color: '#ff0000', font: '...' }
//
// 输出：
//   带内联样式的完整 HTML 片段
//   - body 恒为白底 #ffffff + 深色文字 #1a1a1a
//   - 所有标签带内联 style 属性
//   - 装饰元素渲染为 <div data-decor="...">
//   - 已通过 DOMPurify.sanitize() 过滤

// ============================================================
// 测试用例
// ============================================================

describe('buildHtml', () => {
  // ---- P0 基础渲染 ----

  it('应正确处理纯文本 Markdown', () => {
    const html = buildHtml('你好世界', 'serif_news');
    expect(html).toContain('你好世界');
  });

  it('应渲染 h1 标题带内联样式', () => {
    const html = buildHtml('# 标题', 'serif_news');
    expect(html).toContain('<h1');
    expect(html).toContain('style=');
  });

  it('应渲染有序/无序列表', () => {
    const ul = buildHtml('- 列表项\n- 第二项', 'serif_news');
    expect(ul).toContain('<ul ');  // 内联样式附加在 <ul 标签上
    expect(ul).toContain('列表项');
    expect(ul).toContain('第二项');
    const ol = buildHtml('1. 第一\n2. 第二', 'serif_news');
    expect(ol).toContain('第一');
    expect(ol).toContain('第二');
  });

  // ---- P0 品牌色 ----

  it('应用品牌色到 h1/a/blockquote', () => {
    const html = buildHtml('# 标题\n[链接](/)', 'serif_news', {}, { color: '#ff0000' });
    expect(html).toContain('color:#ff0000');
  });

  it('无品牌色时使用主题默认色', () => {
    const html = buildHtml('# 标题', 'serif_news');
    expect(html).not.toContain('color:#ff0000');
  });

  // ---- P0 微信兼容 ----

  it('body 强制白底 + 深色文字', () => {
    const html = buildHtml('正文', 'neon_tech'); // 深色主题
    expect(html).toContain('background:#ffffff');
    expect(html).toContain('color:#1a1a1a');
  });

  // ---- P0 装饰元素 ----

  it('::: cover 应渲染为封面卡片', () => {
    const html = buildHtml('::: cover\n封面标题\n:::', 'serif_news');
    // buildHtml 会将 data-decor 替换为 CSS block，最终产出包含封面标题的 h1
    expect(html).toContain('封面标题');
    expect(html).toContain('border-top:3px solid');
  });

  it('::: divider 应渲染为装饰分割线', () => {
    const html = buildHtml('::: divider\n\n:::', 'serif_news');
    // buildHtml 会将 data-decor 替换为 ※ ※ ※ 字符
    expect(html).toContain('※ ※ ※');
  });

  it('::: quote 应渲染为金句卡片', () => {
    const html = buildHtml('::: quote\n金句内容\n:::', 'serif_news');
    // buildHtml 会将 data-decor 替换为 styled section
    expect(html).toContain('金句内容');
    expect(html).toContain('border-left:4px solid');
  });

  // ---- P1 边界情况 ----

  it('空 Markdown 应返回空字符串或兜底', () => {
    const html = buildHtml('', 'serif_news');
    expect(typeof html).toBe('string');
  });

  it('未知主题应兜底到 serif_news（特征色 #8b0000）', () => {
    // 使用含 h1 的 markdown 输入，验证兜底后 serif_news 的 h1 颜色 #8b0000
    const html1 = buildHtml('# 标题\n正文', 'unknown_theme');
    expect(html1).toContain('#8b0000');
    // 同时验证 p 标签样式已被注入
    expect(html1).toMatch(/<p\s[^>]*style=/);
  });

  // ---- P2 标签覆盖 ----

  it('code 和 pre 标签带内联样式', () => {
    const html = buildHtml('行内 `code` 和代码块\n\n```\nconst x = 1;\n```', 'serif_news');
    expect(html).toMatch(/<code\s[^>]*style=/);
    expect(html).toMatch(/<pre\s[^>]*style=/);
  });

  it('strong 和 em 标签带内联样式', () => {
    const html = buildHtml('**加粗** *斜体*', 'serif_news');
    expect(html).toMatch(/<strong\s[^>]*style=/);
    expect(html).toMatch(/<em\s[^>]*style=/);
  });

  it('table 带内联样式和斑马纹', () => {
    const html = buildHtml('| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |', 'serif_news');
    expect(html).toMatch(/<table\s[^>]*style=/);
    // 斑马纹：偶数行应有 background-color
    expect(html).toMatch(/<tr[^>]*style="background-color:/);
  });

  it('hr 分割线带内联样式', () => {
    const html = buildHtml('---', 'serif_news');
    expect(html).toMatch(/<hr\s[^>]*style=/);
  });

  it('blockquote 带内联样式', () => {
    const html = buildHtml('> 引用文字', 'serif_news');
    expect(html).toMatch(/<blockquote\s[^>]*style=/);
  });

  it('li 列表项带内联样式', () => {
    const html = buildHtml('- 列表项', 'serif_news');
    expect(html).toMatch(/<li\s[^>]*style=/);
  });

  it('del 删除线带内联样式', () => {
    const html = buildHtml('~~删除~~', 'serif_news');
    expect(html).toMatch(/<del\s[^>]*style=/);
  });

  it('h2 和 h3 标题带内联样式', () => {
    const html = buildHtml('## 二级标题\n\n### 三级标题', 'serif_news');
    expect(html).toMatch(/<h2\s[^>]*style=/);
    expect(html).toMatch(/<h3\s[^>]*style=/);
  });
});

describe('THEMES 数据完整性', () => {
  it('所有主题必须包含 body/h1/h2/h3/p/blockquote/ul/ol/li/img/a 字段', () => {
    const requiredFields = ['body', 'h1', 'h2', 'h3', 'p', 'blockquote', 'ul', 'ol', 'li', 'img', 'a'];
    Object.values(THEMES).forEach((theme, i) => {
      requiredFields.forEach(field => {
        expect(theme, `主题 #${i} 缺少字段 ${field}`).toHaveProperty(field);
      });
    });
  });

  it('所有主题的 mark 字段不为空（marked 不支持 ==高亮== 语法，但样式注入已就绪）', () => {
    Object.entries(THEMES).forEach(([key, value]) => {
      expect(value.mark, `主题 ${key} 缺少 mark 样式`).toBeTruthy();
      expect(value.mark).toMatch(/background:/);
    });
  });
});

// ============================================================
// stripBareDirectives 种子块中和 —— 不误删用户真实内容的装饰块
// ============================================================

describe('stripBareDirectives 种子块中和（边界保护）', () => {
  it('保留 divider 中恰好为「点击编辑文字」的装饰块', () => {
    const md = ':::divider\n点击编辑文字\n:::';
    expect(stripBareDirectives(md)).toContain('点击编辑文字');
  });

  it('保留 quote 中恰好为「点击编辑文字」的装饰块', () => {
    const md = ':::quote\n点击编辑文字\n:::';
    expect(stripBareDirectives(md)).toContain('点击编辑文字');
  });

  it('中和 cover 类型的默认占位种子块（避免成为 misparse 种子）', () => {
    const md = ':::cover\n点击编辑文字\n:::';
    expect(stripBareDirectives(md)).not.toContain('点击编辑文字');
  });

  it('仅中和空前导占位，不影响带真实内容的 cover', () => {
    const md = ':::cover\n我的文章标题\n:::';
    expect(stripBareDirectives(md)).toContain('我的文章标题');
  });
});
