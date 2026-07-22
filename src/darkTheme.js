// ========== 净排 · 暗色主题派生 ==========
//
// 两套派生策略，共用同一套「颜色解析 + 变换」工具：
//
// 1) deriveDarkTheme(theme)      —— 编辑器自身深色模式用。
//    把我们app的编辑器渲染成「深色壳 + 浅色字 + 提亮强调色」，保证主题色在深底下清晰可见。
//    这是「我们自己」的深色风格（刻意把彩色强调色提亮，比微信算法更可控好看）。
//
// 2) deriveWeChatDarkTheme(theme) —— 预览「模拟微信深色模式」开关用。
//    忠实模拟微信读者端深色模式：背景≈#242424、无彩色（黑白灰）文字反白、
//    **有彩色（主题强调色）原样保留**（因为微信不反转彩色）。
//    用来在发布前自查「读者开深色模式会看到什么」。
//
// 两个函数都只动颜色值，保留 font-family/padding/font-size 等非颜色样式。

/* ---------- 颜色解析 / 转换 基础工具 ---------- */

// 解析颜色字符串为 {r,g,b,a}（0~255 / a:0~1）。不支持的返回 null。
function parseColor(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  // #rgb / #rgba / #rrggbb / #rrggbbaa
  let m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) {
      h = h.split('').map((c) => c + c).join('');
    }
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  // rgb() / rgba()
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(',').map((p) => p.trim());
    if (parts.length >= 3) {
      return {
        r: parseFloat(parts[0]) || 0,
        g: parseFloat(parts[1]) || 0,
        b: parseFloat(parts[2]) || 0,
        a: parts[3] !== undefined ? parseFloat(parts[3]) : 1,
      };
    }
  }
  return null;
}

function toHex({ r, g, b, a = 1 }) {
  const c = (v) => {
    const n = Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return n;
  };
  const base = `#${c(r)}${c(g)}${c(b)}`;
  if (a < 1) {
    const aa = Math.round(a * 255).toString(16).padStart(2, '0');
    return `${base}${aa}`;
  }
  return base;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 是否「无彩色 / 近灰」——微信深色模式只反转这类，彩色原样保留
function isAchromatic({ r, g, b }) {
  const { s } = rgbToHsl({ r, g, b });
  return s < 0.15;
}

/* ---------- 三种变换目标 ---------- */

// 深色模式下让文字/强调色「足够浅」以保证可读（轻微降饱和更舒适）
function lightenForDarkText(rgb) {
  const { h, s } = rgbToHsl(rgb);
  const l = clamp(Math.max(rgbToHsl(rgb).l, 0.78), 0, 0.92);
  // 近灰（如 #333）直接给一个统一浅灰；彩色则保留色相、提亮、略降饱和
  const out = isAchromatic(rgb)
    ? { h: 0, s: 0, l: 0.83 }
    : { h, s: s * 0.88, l };
  return { ...toRgbInt(out), a: rgb.a };
}

// 深色模式下让背景「足够暗」
function darkenForBg(rgb) {
  const { h, s, l } = rgbToHsl(rgb);
  if (l > 0.8) {
    // 近白浅色表面（暖白/淡粉白在 HSL 下饱和度高）→ 压成中性深灰，
    // 否则浅色调会被 HSL 保留高饱和色相，变成深红/深蓝等怪异底色。
    return hslToRgba({ h, s: s * 0.12, l: 0.14 }, rgb.a);
  }
  if (l < 0.15) return rgb; // 已是深底，保留原样
  return hslToRgba({ h, s: s * 0.85, l: 0.14 }, rgb.a);
}

function toRgbInt({ h, s, l }) {
  return hslToRgb({ h, s, l });
}

// 把 hsl 转回带 a 的 rgb 对象（供 toHex 使用）
function hslToRgba(hsl, a) {
  return { ...hslToRgb(hsl), a: a === undefined ? 1 : a };
}

/* ---------- 通用 style 字符串颜色变换器 ---------- */

// 遍历一条 CSS 声明串里的颜色 token，按 prop 决定变换方式。
// transform(prop, rgbObj) => 新的 {r,g,b,a} 或原值（不修改则原样返回）。
function mapColorsInStyle(style, transform) {
  if (!style) return style;
  return style
    .split(';')
    .map((decl) => {
      const idx = decl.indexOf(':');
      if (idx < 0) return decl;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1);
      // 颜色相关属性
      const isColor = prop === 'color';
      const isBg = prop === 'background' || prop === 'background-color';
      const isBorder =
        prop === 'border-color' ||
        prop.startsWith('border-') ||
        prop === 'border';
      if (!isColor && !isBg && !isBorder) return decl; // 非颜色属性不动

      const newValue = value.replace(
        /(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b)|(rgba?\([^)]+\))/gi,
        (tok) => {
          const rgb = parseColor(tok);
          if (!rgb) return tok;
          const out = transform(prop, rgb);
          return out ? toHex(out) : tok;
        },
      );
      return `${decl.slice(0, idx)}:${newValue}`;
    })
    .join(';');
}

/* ---------- 派生函数 ---------- */

// 编辑器自身深色模式：背景转暗、正文/强调色提亮（我们自己可控的深色风）
export function deriveDarkTheme(theme) {
  const out = {};
  for (const key of Object.keys(theme)) {
    const v = theme[key];
    if (typeof v !== 'string') {
      out[key] = v;
      continue;
    }
    out[key] = mapColorsInStyle(v, (prop, rgb) => {
      if (prop === 'color' || prop.startsWith('border')) {
        return lightenForDarkText(rgb);
      }
      if (prop === 'background' || prop === 'background-color') {
        return darkenForBg(rgb);
      }
      return rgb;
    });
  }
  return out;
}

// 预览「模拟微信深色」：忠实模拟微信读者端。
// 背景压暗；无彩色文字反白；有彩色（主题强调色）原样保留（微信不反转彩色）。
export function deriveWeChatDarkTheme(theme) {
  const out = {};
  for (const key of Object.keys(theme)) {
    const v = theme[key];
    if (typeof v !== 'string') {
      out[key] = v;
      continue;
    }
    out[key] = mapColorsInStyle(v, (prop, rgb) => {
      const achromatic = isAchromatic(rgb);
      if (prop === 'color' || prop.startsWith('border')) {
        return achromatic ? lightenForDarkText(rgb) : rgb; // 彩色强调色保留
      }
      if (prop === 'background' || prop === 'background-color') {
        // 微信深色：浅色表面→深灰(#242424 级别)；已是深底或中调彩色背景→保留
        const { h, s, l } = rgbToHsl(rgb);
        if (l > 0.8) return hslToRgba({ h, s: s * 0.12, l: 0.14 }, rgb.a);
        if (l < 0.12) return rgb;
        return rgb;
      }
      return rgb;
    });
  }
  return out;
}
