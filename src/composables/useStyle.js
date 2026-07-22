// ========== 净排 · 样式调节逻辑 ==========
import { THEMES, THEME_NAMES } from '../themes.js';

/**
 * 从主题样式中解析数值属性（如 font-size / color）
 * 保持与 buildHtml.js 一致的解析方式
 */
const _parseThemeProp = (themeStyle, prop) => {
  if (!themeStyle) return undefined;
  const map = {
    'font-size': (s) => { const m = s.match(/font-size:\s*(\d+)/); return m ? parseInt(m[1]) : undefined; },
    'color': (s) => { const m = s.match(/color:\s*(#[0-9a-fA-F]{3,8})/); return m ? m[1] : undefined; },
  };
  return map[prop]?.(themeStyle);
};

/**
 * 样式调节 composable：标签选择、滑杆操作、主题套用
 * 默认值从 THEMES.serif_news 动态读取，与主题数据保持联动
 */
export function useStyle(
  customOverrides, selectedTag,
  tempFontSize, tempColor, tempLineHeight, tempLetterSpacing,
  convertMarkdown, showToast
) {
  const getDefaultStyle = (tag, prop) => {
    // 从 THEMES.serif_news 动态解析，保证与主题数据联动
    const val = _parseThemeProp(THEMES.serif_news[tag], prop);
    if (val !== undefined) return val;
    // fallback：未匹配到主题字段时返回保守默认值
    return prop === 'font-size' ? 17 : '#333333';
  };

  const saveToStorage = () => {
    localStorage.setItem('podcast_theme_overrides', JSON.stringify(customOverrides.value));
  };

  const loadTagStyle = () => {
    const tag = selectedTag.value;
    if (customOverrides.value[tag]) {
      const s = customOverrides.value[tag];
      if (s['font-size']) tempFontSize.value = parseInt(s['font-size']);
      else tempFontSize.value = getDefaultStyle(tag, 'font-size');
      if (s['color']) tempColor.value = s['color'];
      else tempColor.value = getDefaultStyle(tag, 'color');
      if (s['line-height']) tempLineHeight.value = parseFloat(s['line-height']);
      else tempLineHeight.value = 1.8;
      if (s['letter-spacing']) tempLetterSpacing.value = parseFloat(s['letter-spacing']);
      else tempLetterSpacing.value = 0;
    } else {
      tempFontSize.value = getDefaultStyle(tag, 'font-size');
      tempColor.value = getDefaultStyle(tag, 'color');
      tempLineHeight.value = 1.8;
      tempLetterSpacing.value = 0;
    }
  };

  const applyCustomStyle = () => {
    if (!selectedTag.value) return;
    const newStyle = {};
    if (tempFontSize.value) newStyle['font-size'] = tempFontSize.value + 'px';
    if (tempColor.value) newStyle['color'] = tempColor.value;
    if (tempLineHeight.value) newStyle['line-height'] = tempLineHeight.value;
    if (tempLetterSpacing.value) newStyle['letter-spacing'] = tempLetterSpacing.value + 'px';

    if (!customOverrides.value[selectedTag.value]) {
      customOverrides.value[selectedTag.value] = {};
    }
    Object.assign(customOverrides.value[selectedTag.value], newStyle);

    if (Object.keys(customOverrides.value[selectedTag.value]).length === 0) {
      delete customOverrides.value[selectedTag.value];
    }

    saveToStorage();
    convertMarkdown();
  };

  const resetTagStyle = () => {
    if (selectedTag.value) {
      delete customOverrides.value[selectedTag.value];
      saveToStorage();
      convertMarkdown();
      loadTagStyle();
    }
  };

  const applyThemeToAll = (currentTheme) => {
    customOverrides.value = {};
    saveToStorage();
    convertMarkdown();
    loadTagStyle();
    showToast('已套用「' + (THEME_NAMES[currentTheme.value] || '主题') + '」到全文', 'success');
  };

  return {
    getDefaultStyle,
    loadTagStyle,
    applyCustomStyle,
    resetTagStyle,
    applyThemeToAll,
  };
}
