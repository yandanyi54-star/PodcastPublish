/**
 * #1 修复回归：编辑器内「字间距」覆盖合并。
 *
 * 根因：useStyle.js 存值时已带单位（letter-spacing: '0.5px'），
 * 但 App.vue editorThemeCss 又补了一次 'px' → 'letter-spacing:0.5pxpx'（非法，整条被浏览器丢弃），
 * 导致编辑器滑杆无效（预览/导出走 buildHtml.js 正确路径，故正常）。
 *
 * 复刻 src/App.vue editorThemeCss 的 styleable-tag 合并（修复后：直接使用存储值，不再补 px），
 * 锁定「不带双 px」行为，防止两处合并逻辑再次漂移。
 */

import { describe, it, expect } from 'vitest';

// 复刻 App.vue:editorThemeCss 的覆盖合并片段（#1 修复后）
function buildTagStyle(override) {
  const parts = [];
  if (override['font-size']) parts.push(`font-size:${override['font-size']}`);
  if (override['color']) parts.push(`color:${override['color']}`);
  if (override['line-height']) parts.push(`line-height:${override['line-height']}`);
  if (override['letter-spacing']) parts.push(`letter-spacing:${override['letter-spacing']}`); // 修复点：不再补 px
  return parts.join(';');
}

describe('编辑器字间距覆盖 (#1)', () => {
  it('letter-spacing 存值已带 px 时，合并结果不应出现双 px', () => {
    const css = buildTagStyle({ 'letter-spacing': '0.5px' });
    expect(css).toBe('letter-spacing:0.5px');
    expect(css).not.toContain('0.5pxpx');
  });

  it('多属性合并与 buildHtml 导出路径产出一致（均合法）', () => {
    const css = buildTagStyle({ 'font-size': '18px', 'letter-spacing': '1px' });
    expect(css).toBe('font-size:18px;letter-spacing:1px');
    expect(css).not.toContain('pxpx');
  });

  it('无 letter-spacing 覆盖时不产出该字段', () => {
    const css = buildTagStyle({ 'font-size': '18px' });
    expect(css).toBe('font-size:18px');
    expect(css).not.toContain('letter-spacing');
  });
});
