// ========== 净排 · 品牌色 / 字体管理 ==========
import { ref } from 'vue';
import { applyBrandToTheme } from '../buildHtml.js';

const BRAND_KEY = 'podcast_brand';

/**
 * 品牌色 / 字体 composable
 * 品牌色重染只动强调色（h1/a/blockquote 的 color）+ body 字体
 */
export function useBrand() {
  const brandColor = ref('');
  const brandFont = ref('');

  // 从 localStorage 加载品牌设置
  const loadBrand = () => {
    try {
      const raw = localStorage.getItem(BRAND_KEY);
      if (!raw) return;
      const b = JSON.parse(raw);
      if (b.color) brandColor.value = b.color;
      if (b.font) brandFont.value = b.font;
    } catch {}
  };

  // 保存品牌设置
  const saveBrand = () => {
    localStorage.setItem(BRAND_KEY, JSON.stringify({
      color: brandColor.value,
      font: brandFont.value,
    }));
  };

  // 应用品牌色到当前主题（通过 buildHtml 的 applyBrandToTheme）
  const applyBrand = (theme) => {
    if (!brandColor.value && !brandFont.value) return theme;
    const branded = { ...theme };
    applyBrandToTheme(branded, { color: brandColor.value, font: brandFont.value });
    saveBrand();
    return branded;
  };

  // 清除品牌色
  const clearBrandColor = () => {
    brandColor.value = '';
    saveBrand();
  };

  // 清除品牌字体
  const clearBrandFont = () => {
    brandFont.value = '';
    saveBrand();
  };

  return {
    brandColor,
    brandFont,
    loadBrand,
    saveBrand,
    applyBrand,
    clearBrandColor,
    clearBrandFont,
  };
}
