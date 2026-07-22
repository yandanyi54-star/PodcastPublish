<!--
  净排 · AI 写作面板组件
  Props:  aiPreset, aiKey, aiBaseUrl, aiModel, aiLoading, aiRecommendations
  Emits:  update:aiPreset, update:aiKey, update:aiBaseUrl, update:aiModel,
          runAction, close
-->
<template>
  <div class="floating-panel">
    <div class="panel-header">
      <h3>AI 写作</h3>
      <button @click="$emit('close')" class="panel-close">×</button>
    </div>
    <div class="panel-content">
      <!-- 前置说明：首次打开提示需自备 Key + 仅本地直连厂商，可关闭且记忆 -->
      <div v-if="!aiIntroSeen" class="ai-intro-notice" role="note">
        <p>
          💡 <strong>使用 AI 需自备 API Key</strong>，且由本机浏览器
          <strong>直连你选择的厂商</strong>（无中间服务器）。填入 Key 后即可调用扩写 / 改写 / 翻译等能力。
        </p>
        <button class="ai-intro-dismiss" @click="$emit('dismiss-ai-intro')">知道了</button>
      </div>
      <p class="panel-tip">🔒 你的 Key 只存在本机，文章只发往你选的厂商，我们服务器看不到。</p>
      <div class="control-group">
        <label class="control-label">接口预设</label>
        <select
          :value="aiPreset"
          @change="$emit('update:aiPreset', ($event.target).value)"
          class="notion-select"
        >
          <option value="deepseek">DeepSeek</option>
          <option value="openai">OpenAI</option>
          <option value="openrouter">OpenRouter（浏览器直连最稳）</option>
          <option value="custom">自定义</option>
        </select>
      </div>
      <div class="control-group">
        <label class="control-label">API Key</label>
        <input
          type="password"
          :value="aiKey"
          @input="$emit('update:aiKey', ($event.target).value)"
          class="notion-input"
          placeholder="sk-..."
        />
      </div>
      <div class="control-group" v-if="aiPreset === 'custom'">
        <label class="control-label">Base URL</label>
        <input
          type="text"
          :value="aiBaseUrl"
          @input="$emit('update:aiBaseUrl', ($event.target).value)"
          class="notion-input"
          placeholder="https://.../v1"
        />
      </div>
      <div class="control-group">
        <label class="control-label">模型名</label>
        <input
          type="text"
          :value="aiModel"
          @input="$emit('update:aiModel', ($event.target).value)"
          class="notion-input"
          placeholder="deepseek-chat"
        />
      </div>
      <div class="ai-actions">
        <template v-for="rec in aiRecommendations.primary" :key="rec.key">
          <button
            class="ai-rec-btn primary"
            :disabled="aiLoading"
            @click="$emit('runAction', rec.key)"
          >
            <span class="ai-rec-label">{{ rec.label }}</span>
            <span class="ai-rec-desc">{{ rec.desc }}</span>
          </button>
        </template>
        <details class="ai-more-details">
          <summary class="ai-more-summary">更多操作 ▸</summary>
          <div class="ai-more-actions">
            <template v-for="rec in aiRecommendations.rest" :key="rec.key">
              <button
                class="notion-btn-small primary"
                :disabled="aiLoading"
                @click="$emit('runAction', rec.key)"
              >{{ rec.label }}</button>
            </template>
          </div>
        </details>
      </div>
      <div class="ai-loading-row" v-if="aiLoading" style="margin-top:12px;">
        <span class="ai-spinner" aria-hidden="true"></span>
        <span class="panel-tip" style="margin:0;">AI 正在处理，请稍候…</span>
        <button class="notion-btn-small" @click="$emit('cancel')" aria-label="取消 AI 请求" style="margin-left:auto;">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  aiPreset: String,
  aiKey: String,
  aiBaseUrl: String,
  aiModel: String,
  aiLoading: Boolean,
  aiRecommendations: Object,
  aiIntroSeen: Boolean,
})

defineEmits([
  'update:aiPreset',
  'update:aiKey',
  'update:aiBaseUrl',
  'update:aiModel',
  'runAction',
  'close',
  'cancel',
  'dismiss-ai-intro',
])
</script>
