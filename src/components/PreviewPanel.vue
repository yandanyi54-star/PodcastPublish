<!--
  净排 · 预览面板组件
  纯展示：手机框 + 预览 HTML + 空状态引导
  Props: showPreview, previewWidth, previewPosition, previewHtml, markdownText, phoneModel
  Emits:  update:previewPosition, update:showPreview, loadSampleArticle, close
-->
<template>
  <section v-if="showPreview" class="preview-section" :style="{ width: previewWidth + 'px' }">
    <div class="preview-header">
      <span class="preview-label">预览</span>
      <div class="preview-controls">
        <div class="preview-btn-group">
          <button
            class="preview-btn"
            :class="{ active: previewPosition === 'left' }"
            @click="$emit('update:previewPosition', 'left')"
          >左</button>
          <button
            class="preview-btn"
            :class="{ active: previewPosition === 'right' }"
            @click="$emit('update:previewPosition', 'right')"
          >右</button>
        </div>
        <button
          class="preview-btn wechat-dark-toggle"
          :class="{ active: previewWechatDark }"
          @click="$emit('update:previewWechatDark', !previewWechatDark)"
          title="模拟微信深色模式（仅预览，不影响导出）"
        >🌙 微信深色</button>
        <button class="preview-btn" @click="$emit('update:showPreview', false)">隐藏</button>
      </div>
    </div>
    <div class="phone-wrapper">
      <div class="phone-frame" :class="phoneModel">
        <div class="phone-wechat-bar">
          <svg class="wechat-back" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#576b95" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span class="wechat-title">公众号文章预览</span>
          <svg class="wechat-menu" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#576b95" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </div>
        <div v-if="!markdownText.trim()" class="phone-content">
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p class="empty-title">开始创作你的公众号文章</p>
            <p class="empty-hint">在左侧编辑器中用 Markdown 写作，这里实时变成公众号样式</p>
            <div class="empty-features">
              <span class="empty-feature">🎨 10 套主题</span>
              <span class="empty-feature">🖼️ 装饰元素</span>
              <span class="empty-feature">🤖 AI 辅助</span>
              <span class="empty-feature">🔒 纯本地</span>
            </div>
            <button class="empty-sample-btn" @click="$emit('loadSampleArticle')">📂 载入示例文章</button>
          </div>
        </div>
        <div v-else class="phone-content" v-html="previewHtml"></div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  showPreview: Boolean,
  previewWidth: Number,
  previewPosition: String,
  previewHtml: String,
  markdownText: String,
  phoneModel: String,
  previewWechatDark: Boolean,
})

defineEmits([
  'update:previewPosition',
  'update:showPreview',
  'update:previewWechatDark',
  'loadSampleArticle',
])
</script>
