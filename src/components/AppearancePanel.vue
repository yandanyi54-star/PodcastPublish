<!--
  净排 · 外观面板组件（B5 统一）
  将「样式调节」与「设置-品牌」合并为单一「外观」面板，显式三层叠：
    ① 主题（打底）→ ② 品牌色/字体（叠加于主题）→ ③ 逐元素微调（收尾）
  手机型号为预览设备选项，不属于外观层，单独成组。
  Props:  currentTheme, selectedTag, tempFontSize, tempColor, tempLineHeight,
          tempLetterSpacing, brandColor, brandFont, phoneModel
  Emits:  v-model events + selectTheme, loadTagStyle, applyStyle, applyAll,
          resetTag, applyBrand, clearBrand, close
-->
<template>
  <div class="floating-panel">
    <div class="panel-header">
      <h3>外观</h3>
      <div class="header-actions">
        <button class="apply-all-btn" @click="$emit('applyAll')">🚀 套用全部主题</button>
        <button @click="$emit('close')" class="panel-close">×</button>
      </div>
    </div>

    <div class="cascade-note">
      <span class="cascade-title">三层叠放</span>
      ① 主题打底 → ② 品牌色叠加 → ③ 逐元素微调收尾。
      「套用全部主题」会清空微调、<b>保留品牌色</b>。
    </div>

    <div class="panel-content">
      <!-- ===== ① 主题（打底） ===== -->
      <div class="panel-section">
        <div class="section-label">① 主题（打底）</div>
        <div class="control-group">
          <label class="control-label">主题</label>
          <div class="theme-picker" tabindex="0" @focusout="showDropdown = false">
            <div class="theme-picker-trigger" @click="toggleDropdown">
              <span class="theme-dot" :style="{ background: themeAccent }"></span>
              <span class="theme-picker-label">{{ themeLabel }}</span>
              <span class="theme-picker-arrow" :class="{ open: showDropdown }">▾</span>
            </div>
            <div class="theme-picker-dropdown" v-if="showDropdown">
              <div v-for="(t, key) in THEMES" :key="key"
                class="theme-picker-option"
                :class="{ active: currentTheme === key }"
                @mousedown.prevent="$emit('selectTheme', key)">
                <span class="theme-dot" :style="{ background: t.uiAccent }"></span>
                {{ THEME_NAMES[key] }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== ② 品牌（叠加于主题） ===== -->
      <div class="panel-section">
        <div class="section-label">② 品牌（叠加于主题）</div>
        <div class="control-group">
          <label class="control-label">品牌主色</label>
          <div class="control-row">
            <input
              type="color"
              :value="brandColor"
              @input="$emit('update:brandColor', ($event.target).value); $emit('applyBrand')"
              class="notion-color"
            />
            <span class="control-value">{{ brandColor || '跟随主题' }}</span>
            <button class="notion-btn-text" v-if="brandColor" @click="$emit('clearBrand')">清除</button>
          </div>
        </div>
        <div class="control-group">
          <label class="control-label">正文字体</label>
          <div class="control-row">
            <select
              :value="brandFont"
              @change="$emit('update:brandFont', ($event.target).value); $emit('applyBrand')"
              class="notion-select"
            >
              <option value="">系统默认</option>
              <option value="serif">宋体 / Serif</option>
              <option value="sans">黑体 / Sans</option>
              <option value="kai">楷体</option>
              <option value="deng">等线</option>
            </select>
            <button class="notion-btn-text" v-if="brandFont" @click="$emit('clearBrandFont')">清除</button>
          </div>
        </div>
      </div>

      <!-- ===== ③ 逐元素微调 ===== -->
      <div class="panel-section">
        <div class="section-label">③ 逐元素微调</div>
        <div class="control-group">
          <label class="control-label">选择标签</label>
          <select
            :value="selectedTag"
            @change="$emit('update:selectedTag', ($event.target).value); $emit('loadTagStyle')"
            class="notion-select"
          >
            <option value="h1">H1 标题</option>
            <option value="h2">H2 标题</option>
            <option value="h3">H3 标题</option>
            <option value="p">正文段落</option>
            <option value="blockquote">引用块</option>
          </select>
        </div>
        <div class="control-group">
          <label class="control-label">字号</label>
          <div class="control-row">
            <input
              type="range"
              :value="tempFontSize"
              @input="$emit('update:tempFontSize', Number(($event.target).value)); $emit('applyStyle')"
              min="12" max="48"
              class="notion-range"
            />
            <span class="control-value">{{ tempFontSize }}px</span>
          </div>
        </div>
        <div class="control-group">
          <label class="control-label">颜色</label>
          <div class="control-row">
            <input
              type="color"
              :value="tempColor"
              @input="$emit('update:tempColor', ($event.target).value); $emit('applyStyle')"
              class="notion-color"
            />
            <span class="control-value">{{ tempColor }}</span>
          </div>
        </div>
        <div class="control-group">
          <label class="control-label">行间距</label>
          <div class="control-row">
            <input
              type="range"
              :value="tempLineHeight"
              @input="$emit('update:tempLineHeight', Number(($event.target).value)); $emit('applyStyle')"
              min="1" max="3" step="0.1"
              class="notion-range"
            />
            <span class="control-value">{{ tempLineHeight }}</span>
          </div>
        </div>
        <div class="control-group">
          <label class="control-label">字间距</label>
          <div class="control-row">
            <input
              type="range"
              :value="tempLetterSpacing"
              @input="$emit('update:tempLetterSpacing', Number(($event.target).value)); $emit('applyStyle')"
              min="0" max="5" step="0.5"
              class="notion-range"
            />
            <span class="control-value">{{ tempLetterSpacing }}px</span>
          </div>
        </div>
        <button @click="$emit('resetTag')" class="notion-btn-text">重置该标签</button>
      </div>

      <!-- ===== 预览设备（非外观层） ===== -->
      <div class="panel-section">
        <div class="section-label">预览设备（仅预览，不导出）</div>
        <div class="control-group">
          <label class="control-label">手机型号</label>
          <select
            :value="phoneModel"
            @change="$emit('update:phoneModel', ($event.target).value)"
            class="notion-select"
          >
            <option value="iphone-se">📱 iPhone SE (375px)</option>
            <option value="iphone-14">📱 iPhone 14 (390px)</option>
            <option value="iphone-14pm">📱 iPhone 14 Pro Max (430px)</option>
            <option value="android-small">📱 安卓小屏 (360px)</option>
            <option value="android-large">📱 安卓大屏 (412px)</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { THEMES, THEME_NAMES } from '../themes.js'

const props = defineProps({
  currentTheme: String,
  selectedTag: String,
  tempFontSize: Number,
  tempColor: String,
  tempLineHeight: Number,
  tempLetterSpacing: Number,
  brandColor: String,
  brandFont: String,
  phoneModel: String,
})

defineEmits([
  'update:selectedTag', 'update:tempFontSize', 'update:tempColor',
  'update:tempLineHeight', 'update:tempLetterSpacing',
  'update:brandColor', 'update:brandFont', 'update:phoneModel',
  'selectTheme', 'loadTagStyle', 'applyStyle', 'applyAll', 'resetTag',
  'applyBrand', 'clearBrand', 'clearBrandFont', 'close',
])

const showDropdown = ref(false)
function toggleDropdown() { showDropdown.value = !showDropdown.value }

const themeAccent = computed(() => THEMES[props.currentTheme]?.uiAccent || '#333')
const themeLabel = computed(() => THEME_NAMES[props.currentTheme] || props.currentTheme)
</script>
