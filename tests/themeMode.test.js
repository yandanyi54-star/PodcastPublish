/**
 * #2 修复验证：跟随系统（system）模式不再把外壳写死成深色。
 *
 * 修复前：variables.css 把 `:root[data-theme="system"]` 与 `dark` 共用深色变量，
 * App.vue 内也有 8 处 `:root[data-theme="system"]` 选择器 → 外壳恒深色，
 * 且 OS=浅色时与编辑区（isDarkMode 取 systemDark）明暗割裂。
 *
 * 修复后：外壳 CSS 仅 `:root[data-theme="dark"]` 用深色；App.vue 端以 resolveMode
 * 把 system 解析为 light/dark 并写 data-theme，外壳/编辑区一致跟随系统。
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const variablesCss = readFileSync(resolve(__dirname, '../src/styles/variables.css'), 'utf-8');

// 复刻 App.vue resolveMode（#2 修复后）
const resolveMode = (mode, systemDark) =>
  mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

describe('跟随系统外壳 (#2)', () => {
  it('variables.css 不再把 system 当作独立深色选择器', () => {
    expect(variablesCss).not.toContain(':root[data-theme="system"]');
  });

  it('variables.css 仍为 dark 提供深色变量块', () => {
    expect(variablesCss).toContain(':root[data-theme="dark"]');
    expect(variablesCss).toContain('--bg-primary: #2e2d38');
  });

  it('resolveMode 正确解析 system → 实际 light/dark', () => {
    expect(resolveMode('system', true)).toBe('dark');
    expect(resolveMode('system', false)).toBe('light');
    // 非 system 模式原样返回，不受影响
    expect(resolveMode('dark', false)).toBe('dark');
    expect(resolveMode('light', true)).toBe('light');
  });
});
