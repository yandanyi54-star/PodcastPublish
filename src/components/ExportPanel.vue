<!--
  净排 · 导出面板组件
  Props:  none (所有逻辑在父组件)
  Emits:  exportHtml, exportMarkdown, openWeChat, close
-->
<template>
  <div class="floating-panel">
    <div class="panel-header">
      <h3>导出</h3>
      <button @click="$emit('close')" class="panel-close">×</button>
    </div>
    <div class="panel-content">
      <p class="panel-tip">把排版好的内容落盘或发到微信。全程在本地完成，不联网。</p>
      <div class="export-actions">
        <button class="notion-btn-small primary" @click="$emit('exportHtml')">⬇️ 下载 HTML 文件</button>
        <button class="notion-btn-small" @click="$emit('exportMarkdown')">⬇️ 下载 Markdown</button>
        <button class="notion-btn-small" @click="$emit('openWeChat')">🔗 一键打开微信后台</button>
      </div>
      <p class="panel-tip" style="margin-top:16px;">
        提示：HTML 文件带完整内联样式，可直接发给同事或上传微信素材库；Markdown 方便归档。
      </p>
    </div>
  </div>
</template>

<script setup>
defineEmits(['exportHtml', 'exportMarkdown', 'openWeChat', 'close'])
</script>
