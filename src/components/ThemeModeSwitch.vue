<template>
  <div class="theme-mode-switch" ref="root" role="radiogroup" aria-label="外观模式" @keydown="onKeydown">
    <button
      v-for="m in THEME_MODES"
      :key="m.key"
      class="mode-option"
      role="radio"
      :aria-checked="modelValue === m.key"
      :tabindex="modelValue === m.key ? 0 : -1"
      :class="{ active: modelValue === m.key }"
      @click="$emit('select', m.key)"
      :title="m.label"
    >
      <span class="mode-icon">{{ m.icon }}</span>
      <span class="mode-label">{{ m.label }}</span>
    </button>
  </div>
</template>

<script setup>
// 外观三态分段控件（B3）：浅色 / 深色 / 跟随，一步直达，role=radio + aria-checked 保证可访问性。
// 状态（themeMode）与动作（setThemeMode）由 App.vue 持有，组件仅 emit 'select'。
// 键盘可达性：roving tabindex（仅选中项可 Tab 聚焦）+ 方向键在选项间移动（radiogroup 规范）。
import { ref, nextTick } from 'vue';
const THEME_MODES = [
  { key: 'light', label: '浅色', icon: '☀' },
  { key: 'dark', label: '深色', icon: '🌙' },
  { key: 'system', label: '跟随', icon: '🖥' }
];
const MODE_ORDER = ['light', 'dark', 'system'];
const props = defineProps({ modelValue: String });
const emit = defineEmits(['select']);
const root = ref(null);

const onKeydown = async (e) => {
  const idx = MODE_ORDER.indexOf(props.modelValue);
  if (idx < 0) return;
  let next = -1;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (idx + 1) % MODE_ORDER.length;
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (idx - 1 + MODE_ORDER.length) % MODE_ORDER.length;
  if (next >= 0 && next !== idx) {
    e.preventDefault();
    emit('select', MODE_ORDER[next]);
    await nextTick();
    root.value?.querySelectorAll('.mode-option')?.[next]?.focus();
  }
};
</script>

<style scoped>
.theme-mode-switch {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 40px;
  height: 44px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.mode-option .mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1;
}
.mode-option .mode-label {
  font-size: 11px;
  line-height: 1;
  pointer-events: none;
}
.mode-option:hover {
  background: var(--bg-hover);
}
.mode-option.active {
  background: var(--bg-active);
}
.mode-option.active .mode-icon,
.mode-option.active .mode-label {
  color: var(--accent-green);
}
.mode-option:focus-visible {
  outline: 2px solid var(--accent-green);
  outline-offset: 2px;
}
@media (max-width: 768px) {
  .theme-mode-switch {
    flex-direction: row;
    gap: 2px;
  }
  .mode-option {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
  }
  .mode-option .mode-label {
    display: none;
  }
}
</style>
