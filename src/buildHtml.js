// ========== 净排 · Markdown → HTML 排版管线 ==========

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { THEMES, DEFAULT_NESTED_LIST } from './themes.js';
import { deriveWeChatDarkTheme } from './darkTheme.js';

/**
 * 剔除空段落序列化产生的「裸 :::」artifact，同时还原 remark-directive 的转义，
 * 并中和「默认占位装饰种子块」。
 *
 * 根因（Bug A 最终真相）：
 * 早期 insertDecorBlock 插入 `\n::: cover\n点击编辑文字\n:::\n`，其中的「点击编辑文字」是占位文字。
 * 当文档里再出现一个裸 :::（浏览器 remark-directive 对空段落/容器的序列化怪癖），二者相邻会被
 * misparse 成真 cover 节点，且该节点序列化后又产出裸 :::，形成自我循环，编辑器里不断冒封面卡片。
 * 合法装饰必带类型名（cover/divider/quote），用栈式解析区分裸 ::: 与合法闭合（见下）。
 * 此外，这里先把「带默认占位文字的装饰块」整体中和掉，从源头消除种子。
 */
export const stripBareDirectives = (md) => {
  // 还原 remark-directive 序列化对 ::: 的反斜杠转义（\::: → :::）
  let s = String(md).replace(/\\(:::[^\n]*)/g, '$1');
  // 中和「默认占位装饰种子块」：::: cover\n点击编辑文字\n:::
  // （转义变体已被上一行还原为普通 :::，故只需匹配一种）。此块是 Bug A 的 misparse 种子，
  // 必须在其进入解析器前清除。
  // 注意：默认种子块只可能是 cover 类型（insertDecorBlock 插入的就是 cover 占位）。
  // 故这里只匹配 cover，避免误删用户真实内容中「恰好是『点击编辑文字』」的 divider/quote 装饰块。
  s = s.replace(/^[ \t]*:::[ \t]*cover[ \t]*\r?\n[ \t]*点击编辑文字[ \t]*\r?\n[ \t]*:::[ \t]*$/gm, '');
  const lines = s.split('\n');
  const stack = [];
  const remove = new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 类型名捕获：`:::cover` / `::: cover` 都算带类型（remark-directive 规范为无空格，
    // 但旧草稿可能带空格，两种都按合法开标签处理）；纯 `:::` 才视为裸开标签。
    const m = line.match(/^[ \t]*:::(?:[ \t]+)?(\w+)?/);
    if (!m) continue;
    if (m[1]) {
      stack.push(i); // 带类型名 → 合法开标签
    } else if (stack.length > 0) {
      stack.pop(); // 与合法开标签配对 → 保留（合法闭合）
    } else {
      // 栈为空时的孤立裸 ::: → artifact 开标签
      remove.add(i);
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      if (j < lines.length && /^[ \t]*:::[ \t]*$/.test(lines[j])) remove.add(j);
    }
  }
  return lines.filter((_, i) => !remove.has(i)).join('\n');
};

// ---------- 颜色派生：主题色 / 品牌色 → HSL 暗 / 浅底 ----------
export const _brandShade = (hex, dL = -10) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toHSL = (rr, gg, bb) => {
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    let h, s; const l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rr: h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6; break;
        case gg: h = ((bb - rr) / d + 2) / 6; break;
        case bb: h = ((rr - gg) / d + 4) / 6; break;
      }
    }
    return [h * 360, s * 100, l * 100];
  };
  const toHex = (hh, ss, ll) => {
    ss = Math.max(0, Math.min(100, ss)) / 100;
    // 浅底上限 94%：避免品牌色偏亮时浅底被钳成纯白，失去品牌色调
    ll = Math.max(0, Math.min(94, ll)) / 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    return '#' + [hue2rgb(p, q, hue2rgb(p, q, hh + 1 / 3)), hue2rgb(p, q, hh), hue2rgb(p, q, hh - 1 / 3)]
      .map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  };
  const [h, s, l] = toHSL(r, g, b);
  return toHex(h / 360, s, l + dL);
};

// ---------- 封面卡片 ----------
export const buildCoverBlock = (text, decorColor) => {
  return `<div style="text-align:center;padding:36px 20px 32px;margin:32px 0;border-top:3px solid ${decorColor};border-bottom:1px solid ${decorColor};"><h1 style="margin:0;color:${decorColor};">${text}</h1></div>`;
};

// ---------- 分割线 ----------
export const buildDividerBlock = (decorColor) => {
  return `<div style="text-align:center;color:${decorColor};font-size:20px;letter-spacing:14px;margin:28px 0;line-height:1;">※ ※ ※</div>`;
};

// ---------- 金句卡片 ----------
export const buildQuoteSection = (text, decorColor, quoteBg, quoteText) => {
  return `<section style="margin:16px 0;padding:20px 24px;border-radius:8px;border-left:4px solid ${decorColor};background:${quoteBg};color:${quoteText};font-size:17px;line-height:1.8;">${text}</section>`;
};

/**
 * Markdown → 微信公众号兼容 HTML（纯前端）
 *
 * ⚠️ 重要安全说明：
 * 本函数返回的 HTML 包含用户输入的 Markdown 内容，可能含有 XSS 向量。
 * - 浏览器环境：务必通过 DOMPurify.sanitize() 过滤后再插入 DOM
 * - 测试环境：可信任输入时可跳过净化
 *
 * @param {string} md - Markdown 源文本
 * @param {string} theme - 主题 key（默认兜底 serif_news）
 * @param {object} [overrides] - 用户自定义覆盖
 * @param {object} [brand] - 品牌色配置 { color, font }
 * @param {object} [options] - 选项
 * @param {boolean} [options.sanitize=false] - 是否通过 DOMPurify 过滤输出
 * @param {object} [options.imageWidthMap] - 图片宽度映射 { src → width(%) }
 * @returns {string} 带内联样式的 HTML 片段
 */
export const buildHtml = (md, theme, overrides, brand, options = {}) => {
  const base = THEMES[theme] || THEMES.serif_news;
  let t = { ...base };
  // 品牌色/字体重染（使用共享函数，保证与 editorThemeCss 一致）
  applyBrandToTheme(t, brand);
  // 默认：强制白底 + 深色正文，保证预览/导出与公众号白底阅读一致（所见即所得）。
  // 预览「模拟微信深色模式」开启时：改用 deriveWeChatDarkTheme —— 背景压暗、无彩色文字反白、
  // 有彩色（主题强调色）原样保留，忠实模拟微信读者端深色观感。
  if (options.wechatDark) {
    t = deriveWeChatDarkTheme(t);
  } else {
    t.body = t.body
      .replace(/background:[^;]+/, 'background:#ffffff')
      .replace(/color:[^;]+/, 'color:#1a1a1a');
  }
  // 预处理：::: container 语法 → raw HTML div（marked 保留不处理，用户可见可编辑）
  // stripBareDirectives 同时还原 remark-directive 的转义（\::: → :::）并剔除空段落
  // 序列化产生的「裸 :::」artifact（详见该函数注释 / Bug A 根因）。
  md = stripBareDirectives(md);
  // 支持 `:::cover`（remark-directive 规范语法，无空格）与兼容旧 `::: cover`（带空格）两种写法
  md = md.replace(/::: ?(\w+)\n([\s\S]*?)\n:::/g, (_, type, content) =>
    `<div data-decor="${type}">${content.trim()}</div>`);

  let html = marked.parse(md);

  // 三层级联配色：主题 h1 强调色 → 品牌色覆盖 → 装饰渲染消费
  const themeAccent = (t.h1 || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#333';
  const quoteBg = (t.blockquote || '').match(/background:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || _brandShade(themeAccent, 82);
  const quoteText = (t.blockquote || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#555';
  const decorColor = brand?.color || themeAccent;

  // Post-process: 装饰容器 → 纯 CSS div / styled section（全部微信完美兼容，文字可选中可搜索）
  html = html.replace(/<div data-decor="cover">([\s\S]*?)<\/div>/g, (_, text) => buildCoverBlock(text.trim(), decorColor));
  html = html.replace(/<div data-decor="divider">[\s\S]*?<\/div>/g, () => buildDividerBlock(decorColor));
  html = html.replace(/<div data-decor="quote">([\s\S]*?)<\/div>/g, (_, text) => buildQuoteSection(text.trim(), decorColor, quoteBg, quoteText));

  // 给标签加内联样式（L1: h1-h6/p/blockquote 支持用户覆盖；L2: ul/ol/li/img/a/code/pre/hr/table/th/td 模板注入；L3: strong/em/del/mark 语义增强）
  const styleableTags = ['h1','h2','h3','h4','h5','h6','p','blockquote','ul','ol','li','img','a','code','pre','hr','table','th','td','strong','em','del','mark'];
  styleableTags.forEach(tag => {
    let style = t[tag] || '';
    if (overrides && overrides[tag]) {
      const ov = overrides[tag];
      const parts = [];
      if (ov['font-size']) parts.push(`font-size:${ov['font-size']}`);
      if (ov['color']) parts.push(`color:${ov['color']}`);
      if (ov['line-height']) parts.push(`line-height:${ov['line-height']}`);
      if (ov['letter-spacing']) parts.push(`letter-spacing:${ov['letter-spacing']}`);
      // 合并语义：用户覆盖叠在主题样式之上，而非整体替换
      // （否则只改 h1 颜色会丢失主题的字号/字重/下边框等整套样式，退化成浏览器默认 h1）
      if (parts.length) style = t[tag] ? t[tag] + ';' + parts.join(';') : parts.join(';');
    }
    if (style) {
      // 匹配「标签名 + 可选属性（含前导空格）」：旧正则 <tag(\s|)> 只能命中无属性标签，
      // 导致 <a href>、<img src>、<code class> 等带属性标签永远注入不了样式
      // （链接/图片/代码块样式、品牌色重染链接全部失效）。改用 (\s[^>]*)? 吞掉属性并保留。
      // 合并而非前置：若标签已有 style（如封面内嵌 <h1 style="margin:0;color">），
      // 主题样式在前、原 inline 在后，让内联的 margin:0/color 优先，且不会产生重复 style 属性
      html = html.replace(new RegExp(`<${tag}((?:\\s[^>]*)?)>`, 'g'), (_, attrs = '') =>
        /style="/.test(attrs)
          ? `<${tag}${attrs.replace(/style="([^"]*)"/, `style="${style};$1"`)}>`
          : `<${tag}${attrs} style="${style}">`
      );
    }
  });

  // Post-process A: 嵌套列表深度注入（二级 ul/ol 缩进 + 减小字号）
  // 注意：marked 渲染嵌套列表时，内层 <ul>/<ol> 紧跟在 <li> 文本之后（中间有文字、无空白），
  // 旧正则 /(<li[^>]*>)\s*(<(?:ul|ol))/ 要求 <li> 后紧跟空白再跟列表，实际 0 命中（功能从未生效）。
  // 改用负向前瞻 (?:(?!<\/li>)[\s\S])*? 限制只匹配「同一 <li> 内首个嵌套列表」，避免跨 <li> 误配。
  const nestedListStyle = t.nestedList || DEFAULT_NESTED_LIST;
  if (nestedListStyle) {
    html = html.replace(/(<li[^>]*>)(?:(?!<\/li>)[\s\S])*?<(ul|ol)(\s[^>]*)?>/g, (_, li, list, attrs = '') => {
      const merged = attrs.includes('style=')
        ? attrs.replace(/style="([^"]*)"/, `style="$1;${nestedListStyle}"`)
        : `${attrs} style="${nestedListStyle}"`;
      return `${li}<${list}${merged}>`;
    });
  }

  // Post-process B: 表格偶数行斑马纹（微信兼容）
  // 斑马纹色从 body 背景派生：浅色底略深、深色底略浅，避免硬编码 #f9f9f9 在深色主题（如霓虹赛博）下刺眼；
  // wechat 模式 body 被强制白底，自然得到浅灰斑马纹。
  if (t.td) {
    let zebra = '#f4f4f4';
    const bgMatch = t.body.match(/background:\s*(#[0-9a-fA-F]{6})/);
    if (bgMatch) {
      const hex = bgMatch[1];
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      const lum = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      const d = lum >= 128 ? -10 : 18;
      const c = v => Math.max(0, Math.min(255, v + d)).toString(16).padStart(2, '0');
      zebra = '#' + c(r) + c(g) + c(b);
    }
    let isEven = false;
    html = html.replace(/<tr([^>]*)>/g, (_, attrs) => {
      if (isEven) {
        isEven = false;
        return `<tr${attrs} style="background-color:${zebra}">`;
      } else {
        isEven = true;
        return `<tr${attrs}>`;
      }
    });
  }

  // Post-process C: 从 imageWidthMap 注入图片宽度（编辑器内宽度信息单独存储）
  if (options?.imageWidthMap && typeof options.imageWidthMap === 'object') {
    const map = options.imageWidthMap;
    html = html.replace(/<img\s([^>]*)src="([^"]*)"[^>]*>/g, (match, before, src) => {
      const w = map[src];
      // 仅当 width 有值且 < 100% 才注入（100% = 默认，不注入）
      if (w && w > 0 && w < 100) {
        // 如果已有 width 属性，替换它
        if (/\bwidth\s*=\s*/.test(match)) {
          return match.replace(/\bwidth\s*=\s*["'][^"']*["']/, `width="${w}%"`);
        }
        return match.replace('<img', `<img width="${w}%"`);
      }
      return match;
    });
  }

  const result = `<div style="${t.body}">${html}</div>`;
  return options.sanitize ? DOMPurify.sanitize(result) : result;
};

/**
 * 品牌色/字体重染工具函数：对主题副本 t 就地修改（mutate），返回 true/false
 *
 * ⚠️ 注意：当前正则假定颜色值为纯 hex（#xxx），适合当前 10 套主题；
 * 若新增主题使用 rgb/rgba/hsl 等函数式颜色，需要更新此正则以支持函数括号。
 *
 * @param {object} t - 主题对象的浅拷贝（会被就地修改）
 * @param {object|null} brand - 品牌配置 { color?: string, font?: string }
 * @returns {boolean} 是否实际修改了主题
 */
export const applyBrandToTheme = (t, brand) => {
  if (!brand) return false;
  let modified = false;
  if (brand.color) {
    ['h1', 'a', 'blockquote'].forEach(tag => {
      if (t[tag]) {
        t[tag] = t[tag]
          .replace(/color:[^;]+/, 'color:' + brand.color)
          .replace(/(border-left:[^;]*?)(#[0-9a-fA-F]{3,8})/i, '$1' + brand.color);
        modified = true;
      }
    });
  }
  if (brand.font) {
    t.body = t.body.replace(/font-family:[^;]+/, 'font-family:' + brand.font);
    modified = true;
  }
  return modified;
};
