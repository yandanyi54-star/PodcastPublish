<template>
  <div class="app-root">
    <!-- 恢复草稿横幅 -->
    <Transition name="banner-slide">
      <div v-if="showRecoveryBanner" class="recovery-banner">
        <span>👋 欢迎回来，已为你恢复上次没写完的草稿。放心，它一直只躺在你的设备上，从没上传过任何服务器。</span>
        <button class="banner-close" @click="showRecoveryBanner = false">×</button>
      </div>
    </Transition>

    <!-- 左侧图标工具栏 -->
    <div class="left-toolbar">
      <div class="toolbar-brand">
        <span class="brand-icon">📐</span>
      </div>
      
      <!-- AI 区 -->
      <div
        class="toolbar-item"
        role="button"
        :class="{ active: activePanel === 'ai' }"
        @click="togglePanel('ai')"
        title="AI 写作"
        aria-label="AI 写作"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9.813 1.5l-.433 1.3c-.139.416-.208.624-.33.795a1 1 0 01-.327.27c-.152.075-.372.075-.812.075h-.155c-.376 0-.565 0-.71-.05a1 1 0 01-.618-.454c-.082-.155-.105-.348-.15-.733L6.187 1.5"/><path d="M12.454 3.085l-1.095.72c-.35.23-.525.346-.62.51a1 1 0 00-.12.423c-.005.183.082.386.256.79L11 5.833"/><path d="M2.5 7.5l.62 1.86c.102.305.152.458.055.542C3.077 9.985 2.923 9.985 2.725 9.985H2.5"/><circle cx="8" cy="13" r="2.5"/><path d="M10.748 3.332l.683.641c.163.153.24.28.28.43a.8.8 0 01-.023.374c-.041.149-.16.314-.396.643l-.117.163"/></svg></span>
        <span class="toolbar-label">AI</span>
        <span class="tooltip">AI 写作</span>
      </div>

      <div class="toolbar-divider"></div>
      <div class="toolbar-section-label">编辑</div>

      <!-- 编辑区 -->
      <div
        class="toolbar-item"
        role="button"
        :class="{ active: activePanel === 'import' }"
        @click="togglePanel('import')"
        title="导入文章"
        aria-label="导入文章"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1"/><polyline points="4.5 7.5 8 11 11.5 7.5"/><line x1="8" y1="11" x2="8" y2="2"/></svg></span>
        <span class="toolbar-label">导入</span>
        <span class="tooltip">导入文章</span>
      </div>

      <div
        class="toolbar-item"
        role="button"
        :class="{ active: activePanel === 'style' }"
        @click="togglePanel('style')"
        title="主题与样式"
        aria-label="主题与样式"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M12.5 3c.35.45.7.95 1 1.5M3.5 3c-.35.45-.7.95-1 1.5"/><path d="M2.5 12c.32-.45.67-.86 1.05-1.24M13.5 12c-.32-.45-.67-.86-1.05-1.24"/><path d="M13.5 4c-.32.45-.67.86-1.05 1.24M2.5 4c.32.45.67.86 1.05 1.24"/></svg></span>
        <span class="toolbar-label">样式</span>
        <span class="tooltip">主题 / 样式</span>
      </div>

      <div
        class="toolbar-item"
        role="button"
        :class="{ active: activePanel === 'image' }"
        @click="togglePanel('image')"
        title="装饰"
        aria-label="装饰"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><circle cx="5" cy="6" r="1.2"/><path d="M1.5 11.5l3-2.5 2.5 2 3.5-4 3.5 3"/></svg></span>
        <span class="toolbar-label">装饰</span>
        <span class="tooltip">装饰</span>
      </div>

      <div
        class="toolbar-item"
        role="button"
        @click="copyHtml"
        title="复制 HTML"
        aria-label="复制 HTML"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="1.5" width="10" height="12" rx="1.5"/><path d="M10.5 5v7M5.5 5v7"/></svg></span>
        <span class="toolbar-label">复制</span>
        <span class="tooltip">复制 HTML</span>
      </div>

      <div
        class="toolbar-item"
        role="button"
        @click="clearInlineStyles"
        title="清除内联样式"
        aria-label="清除内联样式"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5H3.5A1.5 1.5 0 002 4v2M10.5 2.5h1.5A1.5 1.5 0 0113.5 4v2M3 13.5l2-2.5 2 3 3-4.5 3.5 4.5M2 12V3"/></svg></span>
        <span class="toolbar-label">清除样式</span>
        <span class="tooltip">清除内联样式</span>
      </div>

      <div class="toolbar-spacer"></div>
      <div class="toolbar-section-label">视图</div>

      <!-- 视图区 -->
      <div
        class="toolbar-item"
        role="button"
        :class="{ active: showPreview }"
        @click="showPreview = !showPreview"
        title="预览"
        :aria-label="showPreview ? '预览中' : '打开预览'"
      >
        <span class="icon">
          <template v-if="showPreview">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="0.5" width="11" height="15" rx="2"/><line x1="8" y1="2.5" x2="8" y2="4"/></svg>
          </template>
          <template v-else>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="0.5" width="11" height="15" rx="2"/><line x1="8" y1="4" x2="8" y2="12"/></svg>
          </template>
        </span>
        <span class="toolbar-label">预览</span>
        <span class="tooltip">{{ showPreview ? '预览中' : '打开预览' }}</span>
      </div>

      <div
        class="toolbar-item"
        role="button"
        :class="{ active: activePanel === 'export' }"
        @click="togglePanel('export')"
        title="导出"
        aria-label="导出"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1"/><polyline points="11.5 5 8 1.5 4.5 5"/><line x1="8" y1="1.5" x2="8" y2="11"/></svg></span>
        <span class="toolbar-label">导出</span>
        <span class="tooltip">导出</span>
      </div>

      <div
        class="toolbar-item"
        role="button"
        @click="showSettings = !showSettings"
        :class="{ active: showSettings }"
        title="设置"
        aria-label="设置"
      >
        <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v2.3M14.3 3.3l-1.8 1.1M14.3 12.7l-1.8-1.1M1.7 12.7l1.8-1.1M1.7 3.3l1.8 1.1"/></svg></span>
        <span class="toolbar-label">设置</span>
        <span class="tooltip">设置</span>
      </div>
    </div>

    <!-- 悬浮面板：样式调节 -->
    <Transition name="panel-slide">
      <div v-if="activePanel === 'style'" class="floating-panel">
        <div class="panel-header">
          <h3>样式调节</h3>
          <div class="header-actions">
            <button class="apply-all-btn" @click="applyThemeToAll">🚀 套用全部</button>
            <button @click="activePanel = null" class="panel-close">×</button>
          </div>
        </div>
        <div class="panel-hint">一键把整套风格铺满全文，不用逐个标签调</div>
        <div class="panel-content">
          <div class="panel-section">
            <div class="section-label">整体风格</div>
            <div class="control-group">
              <label class="control-label">主题</label>
              <div class="theme-picker" tabindex="0" @blur="showThemeDropdown = false">
                <div class="theme-picker-trigger" @click="toggleThemeDropdown">
                  <span class="theme-dot" :style="{ background: THEMES[currentTheme]?.uiAccent }"></span>
                  <span class="theme-picker-label">{{ THEME_NAMES[currentTheme] }}</span>
                  <span class="theme-picker-arrow" :class="{ open: showThemeDropdown }">▾</span>
                </div>
                <div class="theme-picker-dropdown" v-if="showThemeDropdown">
                  <div v-for="(t, key) in THEMES" :key="key"
                    class="theme-picker-option"
                    :class="{ active: currentTheme === key }"
                    @mousedown.prevent="selectTheme(key)">
                    <span class="theme-dot" :style="{ background: t.uiAccent }"></span>
                    {{ THEME_NAMES[key] }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="control-group">
            <label class="control-label">选择标签</label>
            <select v-model="selectedTag" class="notion-select" @change="loadTagStyle">
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
                v-model.number="tempFontSize" 
                min="12" 
                max="48" 
                @input="applyCustomStyle" 
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
                v-model="tempColor" 
                @input="applyCustomStyle" 
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
                v-model.number="tempLineHeight" 
                min="1" 
                max="3" 
                step="0.1"
                @input="applyCustomStyle" 
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
                v-model.number="tempLetterSpacing" 
                min="0" 
                max="5" 
                step="0.5"
                @input="applyCustomStyle" 
                class="notion-range"
              />
              <span class="control-value">{{ tempLetterSpacing }}px</span>
            </div>
          </div>
          <button @click="resetTagStyle" class="notion-btn-text">
            重置该标签
          </button>
        </div>
      </div>
    </Transition>

    <!-- 悬浮面板：装饰 -->
    <Transition name="panel-slide">
      <div v-if="activePanel === 'image'" class="floating-panel">
        <div class="panel-header">
          <h3>装饰</h3>
          <button @click="activePanel = null" class="panel-close">×</button>
        </div>
        <div class="panel-content">
          <p class="panel-tip">装饰元素跟随主题配色，光标处插入，文字可直接编辑。内容全程不联网。</p>
          <label class="control-label">装饰元素</label>
          <div class="decor-grid">
            <button class="decor-item" @click="insertDecorBlock('cover')">
              <span class="decor-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="16" height="16" rx="2"/><circle cx="7" cy="7" r="1.5"/><path d="M2 14l4-4 3 3 4-5 5 6"/></svg></span>
              <span class="decor-name">封面卡片</span>
              <span class="decor-meta">800×400 · 顶部展示</span>
            </button>
            <button class="decor-item" @click="insertDecorBlock('divider')">
              <span class="decor-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="10" x2="8" y2="10"/><circle cx="10" cy="10" r="2"/><line x1="12" y1="10" x2="18" y2="10"/></svg></span>
              <span class="decor-name">分割线</span>
              <span class="decor-meta">800×40 · 段落分隔</span>
            </button>
            <button class="decor-item" @click="insertDecorBlock('quote')">
              <span class="decor-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4v4H2v5h5V7H5V4zM15 4v4h-3v5h5V7h-2V4z"/></svg></span>
              <span class="decor-name">金句卡片</span>
              <span class="decor-meta">自适应 · 金句装点</span>
            </button>
          </div>
          <label class="control-label" style="margin-top:16px;">插入图片</label>
          <div class="search-box">
            <input 
              type="text" 
              v-model="imageUrl" 
              placeholder="https://... 图片地址" 
              @keyup.enter="insertImageByUrl" 
              class="notion-input"
            />
            <button @click="insertImageByUrl" class="notion-btn-small">
              插入
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮面板：导入文章 -->
    <Transition name="panel-slide">
      <div v-if="activePanel === 'import'" class="floating-panel">
        <div class="panel-header">
          <h3>导入文章</h3>
          <button @click="activePanel = null" class="panel-close">×</button>
        </div>
        <div class="panel-content">
          <p class="panel-tip">粘贴网页源码或带格式的正文，净排会自动提纯成干净 Markdown。全程在本地完成。</p>
          <textarea v-model="importText" class="import-textarea" placeholder="粘贴网页链接或带格式正文..."></textarea>
          <div class="import-actions">
            <button class="notion-btn-small primary" @click="importFromText">从文本提纯</button>
            <button class="notion-btn-text" @click="importText = ''">清空</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮面板：AI 写作 -->
    <Transition name="panel-slide">
      <div v-if="activePanel === 'ai'" class="floating-panel">
        <div class="panel-header">
          <h3>AI 写作</h3>
          <button @click="activePanel = null" class="panel-close">×</button>
        </div>
        <div class="panel-content">
          <p class="panel-tip">🔒 你的 Key 只存在本机，文章只发往你选的厂商，我们服务器看不到。</p>
          <div class="control-group">
            <label class="control-label">接口预设</label>
            <select v-model="aiPreset" @change="onAiPresetChange" class="notion-select">
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter（浏览器直连最稳）</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="control-group">
            <label class="control-label">API Key</label>
            <input type="password" v-model="aiKey" @input="saveAiConfig" class="notion-input" placeholder="sk-..." />
          </div>
          <div class="control-group" v-if="aiPreset === 'custom'">
            <label class="control-label">Base URL</label>
            <input type="text" v-model="aiBaseUrl" @input="saveAiConfig" class="notion-input" placeholder="https://.../v1" />
          </div>
          <div class="control-group">
            <label class="control-label">模型名</label>
            <input type="text" v-model="aiModel" @input="saveAiConfig" class="notion-input" placeholder="deepseek-chat" />
          </div>
          <div class="ai-actions">
            <button class="notion-btn-small primary" :disabled="aiLoading" @click="aiGenerateTitle">✨ 生成标题</button>
            <button class="notion-btn-small primary" :disabled="aiLoading" @click="aiWriteSummary">📝 写摘要</button>
            <button class="notion-btn-small primary" :disabled="aiLoading" @click="aiExpand">🔍 扩写段落</button>
            <button class="notion-btn-small primary" :disabled="aiLoading" @click="aiStructure">📐 一键结构化排版</button>
          </div>
          <p class="panel-tip" v-if="aiLoading" style="margin-top:12px;">AI 正在处理，请稍候…</p>
        </div>
      </div>
    </Transition>

    <!-- 悬浮面板：设置 -->
    <Transition name="panel-slide">
      <div v-if="showSettings" class="floating-panel">
        <div class="panel-header">
          <h3>设置</h3>
          <button @click="showSettings = false" class="panel-close">×</button>
        </div>
        <div class="panel-content">
          <div class="control-group">
            <label class="control-label">手机型号</label>
            <select v-model="phoneModel" class="notion-select">
              <option value="iphone-se">📱 iPhone SE (375px)</option>
              <option value="iphone-14">📱 iPhone 14 (390px)</option>
              <option value="iphone-14pm">📱 iPhone 14 Pro Max (430px)</option>
              <option value="android-small">📱 安卓小屏 (360px)</option>
              <option value="android-large">📱 安卓大屏 (412px)</option>
            </select>
          </div>
          <div class="control-group">
            <label class="control-label">品牌主色</label>
            <div class="control-row">
              <input type="color" v-model="brandColor" @input="applyBrand" class="notion-color" />
              <span class="control-value">{{ brandColor || '跟随主题' }}</span>
              <button class="notion-btn-text" v-if="brandColor" @click="clearBrandColor">清除</button>
            </div>
          </div>
          <div class="control-group">
            <label class="control-label">正文字体</label>
            <select v-model="brandFont" @change="applyBrand" class="notion-select">
              <option value="">系统默认</option>
              <option value="serif">宋体 / Serif</option>
              <option value="sans">黑体 / Sans</option>
              <option value="kai">楷体</option>
              <option value="deng">等线</option>
            </select>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮面板：导出 -->
    <Transition name="panel-slide">
      <div v-if="activePanel === 'export'" class="floating-panel">
        <div class="panel-header">
          <h3>导出</h3>
          <button @click="activePanel = null" class="panel-close">×</button>
        </div>
        <div class="panel-content">
          <p class="panel-tip">把排版好的内容落盘或发到微信。全程在本地完成，不联网。</p>
          <div class="export-actions">
            <button class="notion-btn-small primary" @click="exportHtmlFile">⬇️ 下载 HTML 文件</button>
            <button class="notion-btn-small" @click="exportMarkdown">⬇️ 下载 Markdown</button>
            <button class="notion-btn-small" @click="openWeChat">🔗 一键打开微信后台</button>
          </div>
          <p class="panel-tip" style="margin-top:16px;">
            提示：HTML 文件带完整内联样式，可直接发给同事或上传微信素材库；Markdown 方便归档。
          </p>
        </div>
      </div>
    </Transition>

    <!-- 主体区域 -->
    <main class="main-content" :class="{ 'preview-left': previewPosition === 'left', 'preview-hidden': !showPreview, 'panel-open': !!activePanel }">
      <!-- 预览区 -->
      <section v-if="showPreview" class="preview-section" :style="{ width: previewWidth + 'px' }">
        <div class="preview-header">
          <span class="preview-label">预览</span>
          <div class="preview-controls">
            <div class="preview-btn-group">
              <button 
                class="preview-btn" 
                :class="{ active: previewPosition === 'left' }"
                @click="previewPosition = 'left'"
              >左</button>
              <button 
                class="preview-btn" 
                :class="{ active: previewPosition === 'right' }"
                @click="previewPosition = 'right'"
              >右</button>
            </div>
            <button class="preview-btn" @click="showPreview = false">隐藏</button>
          </div>
        </div>
        <div class="phone-wrapper">
          <div 
            class="phone-frame"
            :class="phoneModel"
          >
            <div class="phone-wechat-bar">
              <svg class="wechat-back" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#576b95" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              <span class="wechat-title">公众号文章预览</span>
              <svg class="wechat-menu" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#576b95" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </div>
            <div v-if="!markdownText.trim()" class="phone-content">
              <div class="empty-state">
                <div class="empty-icon">✍️</div>
                <p>在左侧写点什么</p>
                <p class="empty-hint">Markdown 随手写，这里实时变成公众号样式</p>
              </div>
            </div>
            <div v-else class="phone-content" v-html="previewHtml"></div>
          </div>
        </div>
      </section>

      <!-- 拖拽分隔线 -->
      <div 
        v-if="showPreview" 
        class="resize-handle"
        @mousedown="startResize"
        @mousemove="onResize"
        @mouseup="stopResize"
      ></div>

      <!-- 编辑器区域 -->
      <section class="editor-section">
        <div class="editor-container">
          <div class="milkdown-theme-editor" ref="milkdownContainer"></div>
        </div>
        <div class="status-bar">
          <span class="status-privacy">🔒 {{ savedLabel }} · 内容仅存本机</span>
        </div>
      </section>
    </main>

    <!-- Toast 通知 -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </Transition>

    <!-- 移动端预览浮钮 -->
    <button class="mobile-preview-fab" @click="showPreview = !showPreview">
      {{ showPreview ? '✏️ 编辑' : '👁 预览' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { replaceAll, insert, $remark, $nodeSchema, $view } from '@milkdown/kit/utils';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';

// ---------- Toast 通知 ----------
const toast = ref({ show: false, message: '', type: 'success' });

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 2500);
};

// ---------- 面板控制 ----------
const activePanel = ref(null);
const showSettings = ref(false);
const showPreview = ref(true);
const previewPosition = ref('right');
const previewWidth = ref(320);
const phoneModel = ref('iphone-14');

const togglePanel = (panel) => {
  activePanel.value = activePanel.value === panel ? null : panel;
  showSettings.value = false;
};

// ---------- 拖拽调整宽度 ----------
let isResizing = false;

const startResize = (e) => {
  isResizing = true;
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
};

const onResize = (e) => {
  if (!isResizing) return;
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  const rect = mainContent.getBoundingClientRect();
  const offsetX = previewPosition.value === 'right' 
    ? e.clientX - rect.left 
    : rect.right - e.clientX;
  
  previewWidth.value = Math.max(250, Math.min(500, offsetX));
};

const stopResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

// ---------- 装饰 & 图片 ----------
const imageUrl = ref('');
const importText = ref('');

// ---------- AI 写作（用户自带 Key，纯前端直连）----------
const AI_PRESETS = {
  deepseek: { baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  custom: { baseURL: '', model: '' }
};
const aiKey = ref('');
const aiPreset = ref('deepseek');
const aiBaseUrl = ref(AI_PRESETS.deepseek.baseURL);
const aiModel = ref(AI_PRESETS.deepseek.model);
const aiLoading = ref(false);

// ---------- 编辑器内容 ----------
const DEFAULT_CONTENT = `# 欢迎使用 净排

这里是你的第一篇公众号推文。

## 它能帮你做什么
- 用 Markdown 写，右侧实时预览公众号样式
- 选一套主题，一键铺满全文
- 复制 HTML，直接粘进微信后台

## 小提示
> 内容只存在你的浏览器里，关掉页面也不会丢。

开始写点什么吧 ✍️`;

const markdownText = ref(DEFAULT_CONTENT);
const milkdownContainer = ref(null);
let milkdownEditor = null;
let isFromEditor = false;
let isSettingEditor = false;
const previewHtml = ref('');
const currentTheme = ref('serif_news');

// ---------- 样式调节 ----------
const selectedTag = ref('h2');
const tempFontSize = ref(22);
const tempColor = ref('#07c160');
const tempLineHeight = ref(1.8);
const tempLetterSpacing = ref(0);
const customOverrides = ref({});
const brandColor = ref('');
const brandFont = ref('');

// ---------- 加载本地存储 ----------
const loadFromStorage = () => {
  const saved = localStorage.getItem('podcast_theme_overrides');
  if (saved) {
    try {
      customOverrides.value = JSON.parse(saved);
    } catch (e) {
      customOverrides.value = {};
    }
  }
  // 加载草稿
  const savedDraft = localStorage.getItem('podcast_draft');
  if (savedDraft && savedDraft.trim()) {
    markdownText.value = savedDraft;
    lastSavedAt.value = Date.now();
    showRecoveryBanner.value = true;
  }
  // 加载设置
  const savedSettings = localStorage.getItem('podcast_settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      if (settings.previewPosition) previewPosition.value = settings.previewPosition;
      if (settings.previewWidth) previewWidth.value = settings.previewWidth;
      if (settings.phoneModel) phoneModel.value = settings.phoneModel;
      if (settings.showPreview !== undefined) showPreview.value = settings.showPreview;
      if (settings.theme && THEMES[settings.theme]) currentTheme.value = settings.theme;
    } catch (e) {
      console.warn('设置数据损坏，已重置:', e);
      localStorage.removeItem('podcast_settings');
    }
  }
  // 加载品牌设置
  const savedBrand = localStorage.getItem('podcast_brand');
  if (savedBrand) {
    try {
      const b = JSON.parse(savedBrand);
      if (b.color) brandColor.value = b.color;
      if (b.font) brandFont.value = b.font;
    } catch (e) {}
  }
  // 加载 AI 配置
  const savedAi = localStorage.getItem('podcast_ai_config');
  if (savedAi) {
    try {
      const a = JSON.parse(savedAi);
      if (a.key) aiKey.value = a.key;
      if (a.preset) aiPreset.value = a.preset;
      if (a.baseURL) aiBaseUrl.value = a.baseURL;
      if (a.model) aiModel.value = a.model;
    } catch (e) {}
  }
  // 加载当前选中的标签样式
  loadTagStyle();
};

// ---------- 保存到本地存储 ----------
const saveToStorage = () => {
  localStorage.setItem('podcast_theme_overrides', JSON.stringify(customOverrides.value));
};

const saveSettings = () => {
  const settings = {
    previewPosition: previewPosition.value,
    previewWidth: previewWidth.value,
    phoneModel: phoneModel.value,
    showPreview: showPreview.value,
    theme: currentTheme.value
  };
  localStorage.setItem('podcast_settings', JSON.stringify(settings));
};

// ---------- 自动保存状态 ----------
const lastSavedAt = ref(null);
const now = ref(Date.now());
const showRecoveryBanner = ref(false);

const savedLabel = computed(() => {
  if (!lastSavedAt.value) return '输入即自动保存';
  const diff = Math.floor((now.value - lastSavedAt.value) / 1000);
  if (diff < 5) return '刚刚';
  if (diff < 60) return diff + ' 秒前';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  const d = new Date(lastSavedAt.value);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return '已保存于 ' + hh + ':' + mm;
});

// ---------- 保存草稿 ----------
const saveDraft = () => {
  localStorage.setItem('podcast_draft', markdownText.value);
  lastSavedAt.value = Date.now();
};

// ---------- 加载标签样式到面板 ----------
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

const getDefaultStyle = (tag, prop) => {
  const defaults = {
    h1: { 'font-size': 32, 'color': '#8b0000' },
    h2: { 'font-size': 22, 'color': '#222222' },
    h3: { 'font-size': 19, 'color': '#333333' },
    p: { 'font-size': 17, 'color': '#333333' },
    blockquote: { 'font-size': 17, 'color': '#555555' }
  };
  return defaults[tag]?.[prop] || 16;
};

// ---------- 主题预设 ----------
const THEMES = {
  // ========== 原有 4 套（扩展 L1+L2+L3）==========
  serif_news: {
    body: "background:#f9f7f1;font-family:'PingFang SC','Microsoft YaHei','Noto Serif SC',Georgia,serif;color:#333;padding:20px 16px;max-width:100%",
    h1: 'font-size:32px;color:#8b0000;font-weight:bold;margin:16px 0 8px;border-bottom:2px solid #8b0000;padding-bottom:8px',
    h2: 'font-size:22px;color:#222;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:19px;color:#333;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#444;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#555;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#666;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#333;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#555;border-left:3px solid #8b0000;padding:8px 16px;margin:12px 0;background:#f0ebe3',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#333',
    img: 'max-width:100%;border-radius:6px;margin:12px 0',
    a: 'color:#8b0000;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#eee5d9;padding:1px 5px;border-radius:3px;color:#8b0000',
    pre: 'background:#f5f1ea;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#333',
    hr: 'border:0;border-top:1px solid #d9ceba;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#eee5d9;font-weight:bold;padding:8px 12px;border:0.5px solid #d9ceba;color:#333',
    td: 'padding:8px 12px;border:0.5px solid #d9ceba;color:#333',
    strong: 'font-weight:600;color:#222',
    em: 'font-style:italic;color:#555',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fff3cd;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#b57373'
  },
  neon_tech: {
    body: "background:#0d1117;font-family:'PingFang SC','Microsoft YaHei','SF Mono',monospace;color:#c9d1d9;padding:20px 16px;max-width:100%",
    h1: 'font-size:32px;color:#58a6ff;font-weight:bold;margin:16px 0 8px;border-bottom:1px solid #30363d;padding-bottom:8px',
    h2: 'font-size:22px;color:#79c0ff;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:19px;color:#a5d6ff;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#b8d8ff;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#cadfff;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#d0e3ff;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#c9d1d9;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#8b949e;border-left:3px solid #58a6ff;padding:8px 16px;margin:12px 0;background:#161b22',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#c9d1d9',
    img: 'max-width:100%;border-radius:6px;margin:12px 0',
    a: 'color:#58a6ff;text-decoration:none',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#21262d;padding:1px 5px;border-radius:3px;color:#79c0ff',
    pre: 'background:#161b22;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#c9d1d9;border:1px solid #30363d',
    hr: 'border:0;border-top:1px solid #30363d;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#21262d;font-weight:bold;padding:8px 12px;border:0.5px solid #30363d;color:#c9d1d9',
    td: 'padding:8px 12px;border:0.5px solid #30363d;color:#c9d1d9',
    strong: 'font-weight:600;color:#e6edf3',
    em: 'font-style:italic;color:#8b949e',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#1c3a5e;padding:1px 3px;border-radius:2px;color:#c9d1d9',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#8ab8e5'
  },
  mellow_pink: {
    body: "background:#fff5f5;font-family:'PingFang SC','Microsoft YaHei',KaiTi,serif;color:#4a3f3f;padding:20px 16px;max-width:100%",
    h1: 'font-size:32px;color:#c7748b;font-weight:bold;margin:16px 0 8px',
    h2: 'font-size:22px;color:#d4899e;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:19px;color:#e0a0b2;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#e8b5c2;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#eccad3;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#f0d8de;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#4a3f3f;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#8b7b7b;border-left:3px solid #c7748b;padding:8px 16px;margin:12px 0;background:#ffe8ee',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#4a3f3f',
    img: 'max-width:100%;border-radius:8px;margin:12px 0',
    a: 'color:#c7748b;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#ffe8ee;padding:1px 5px;border-radius:3px;color:#c7748b',
    pre: 'background:#ffe8ee;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#4a3f3f',
    hr: 'border:0;border-top:1px solid #f0c8d4;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#ffe8ee;font-weight:bold;padding:8px 12px;border:0.5px solid #f0c8d4;color:#4a3f3f',
    td: 'padding:8px 12px;border:0.5px solid #f0c8d4;color:#4a3f3f',
    strong: 'font-weight:600;color:#3a2f2f',
    em: 'font-style:italic;color:#8b7b7b',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fde0e6;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#d4a3af'
  },
  zen_minimal: {
    body: "background:#fff;font-family:'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif;color:#2c2c2c;padding:20px 16px;max-width:100%",
    h1: 'font-size:32px;color:#1a1a1a;font-weight:bold;margin:16px 0 8px',
    h2: 'font-size:22px;color:#2c2c2c;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:19px;color:#3d3d3d;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#4a4a4a;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#5a5a5a;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#6a6a6a;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#2c2c2c;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#666;border-left:3px solid #d0d0d0;padding:8px 16px;margin:12px 0;background:#f5f5f5',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#2c2c2c',
    img: 'max-width:100%;border-radius:4px;margin:12px 0',
    a: 'color:#2c2c2c;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#f0f0f0;padding:1px 5px;border-radius:3px;color:#e83e8c',
    pre: 'background:#f8f8f8;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#2c2c2c;border:1px solid #e0e0e0',
    hr: 'border:0;border-top:1px solid #e0e0e0;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#f5f5f5;font-weight:bold;padding:8px 12px;border:0.5px solid #d0d0d0;color:#2c2c2c',
    td: 'padding:8px 12px;border:0.5px solid #d0d0d0;color:#2c2c2c',
    strong: 'font-weight:600;color:#1a1a1a',
    em: 'font-style:italic;color:#666',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fff9c4;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#8a8a8a'
  },

  // ========== 新增 6 套（完整 L1+L2+L3）==========
  biz_blue: {
    body: "background:#fff;font-family:'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif;color:#1e293b;padding:20px 16px;max-width:100%",
    h1: 'font-size:32px;color:#185FA5;font-weight:bold;margin:16px 0 8px;border-bottom:2px solid #185FA5;padding-bottom:8px',
    h2: 'font-size:22px;color:#1e3a5f;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:19px;color:#2c5282;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#3a6ba5;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#4d7eb8;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#608fc8;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#1e293b;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#475569;border-left:3px solid #185FA5;padding:8px 16px;margin:12px 0;background:#f0f6ff',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#1e293b',
    img: 'max-width:100%;border-radius:4px;margin:12px 0',
    a: 'color:#185FA5;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#e8f0fe;padding:1px 5px;border-radius:3px;color:#185FA5',
    pre: 'background:#f8fafc;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#1e293b;border:1px solid #e2e8f0',
    hr: 'border:0;border-top:1px solid #cbd5e1;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#e8f0fe;font-weight:bold;padding:8px 12px;border:0.5px solid #cbd5e1;color:#1e3a5f',
    td: 'padding:8px 12px;border:0.5px solid #cbd5e1;color:#1e293b',
    strong: 'font-weight:600;color:#0f172a',
    em: 'font-style:italic;color:#475569',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fef9c3;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#5c8db8'
  },
  warm_coffee: {
    body: "background:#faf6f1;font-family:'PingFang SC','Microsoft YaHei',KaiTi,serif;color:#3d2b1f;padding:20px 16px;max-width:100%",
    h1: 'font-size:32px;color:#6f4e37;font-weight:bold;margin:16px 0 8px;border-bottom:1.5px solid #a0846c;padding-bottom:8px',
    h2: 'font-size:22px;color:#5a3f2c;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:19px;color:#6f4e37;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#7a5942;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#8b6b52;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#9c7d65;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#3d2b1f;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#6b5b4e;border-left:3px solid #a0846c;padding:8px 16px;margin:12px 0;background:#f3ede6',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#3d2b1f',
    img: 'max-width:100%;border-radius:8px;margin:12px 0',
    a: 'color:#6f4e37;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#ede3d8;padding:1px 5px;border-radius:3px;color:#6f4e37',
    pre: 'background:#f3ede6;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#3d2b1f',
    hr: 'border:0;border-top:1px solid #d4c5b3;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#ede3d8;font-weight:bold;padding:8px 12px;border:0.5px solid #d4c5b3;color:#3d2b1f',
    td: 'padding:8px 12px;border:0.5px solid #d4c5b3;color:#3d2b1f',
    strong: 'font-weight:600;color:#2a1a10',
    em: 'font-style:italic;color:#6b5b4e',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fef3cd;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#a0846c'
  },
  ink_literati: {
    body: "background:#fcfaf7;font-family:'PingFang SC','Microsoft YaHei','SimSun','Noto Serif SC',serif;color:#2c3e50;padding:20px 16px;max-width:100%",
    h1: 'font-size:34px;color:#1a1a2e;font-weight:bold;margin:20px 0 10px;border-bottom:1.5px solid #2c3e50;padding-bottom:10px;letter-spacing:2px',
    h2: 'font-size:24px;color:#2c3e50;font-weight:bold;margin:18px 0 8px',
    h3: 'font-size:20px;color:#34495e;font-weight:bold;margin:14px 0 6px',
    h4: 'font-size:18px;color:#3d566e;font-weight:bold;margin:12px 0 5px',
    h5: 'font-size:17px;color:#4a6a82;font-weight:bold;margin:10px 0 4px',
    h6: 'font-size:16px;color:#5a7d96;font-weight:bold;margin:8px 0 3px',
    p: 'font-size:17px;color:#2c3e50;line-height:2;margin:10px 0;letter-spacing:0.5px',
    blockquote: 'font-size:17px;color:#546e7a;border-left:3px solid #2c3e50;padding:10px 18px;margin:14px 0;background:#f5f2ed;font-style:italic',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:5px 0;font-size:17px;color:#2c3e50;line-height:1.9',
    img: 'max-width:100%;border-radius:2px;margin:14px 0',
    a: 'color:#2c3e50;text-decoration:underline;text-underline-offset:3px',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#f0ede6;padding:1px 5px;border-radius:3px;color:#2c3e50',
    pre: 'background:#f5f2ed;padding:14px 18px;border-radius:4px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.7;margin:12px 0;color:#2c3e50;border:1px solid #e8e3da',
    hr: 'border:0;border-top:1px solid #d5cec4;margin:20px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#f0ede6;font-weight:bold;padding:8px 12px;border:0.5px solid #d5cec4;color:#2c3e50',
    td: 'padding:8px 12px;border:0.5px solid #d5cec4;color:#2c3e50',
    strong: 'font-weight:700;color:#1a1a2e',
    em: 'font-style:italic;color:#546e7a',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#f5f0e0;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#6b8299'
  },
  study_notes: {
    body: "background:#fff;font-family:'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif;color:#1a1a2e;padding:20px 16px;max-width:100%",
    h1: 'font-size:30px;color:#1565c0;font-weight:bold;margin:18px 0 8px;border-bottom:2px solid #1565c0;padding-bottom:8px',
    h2: 'font-size:22px;color:#1e40af;font-weight:bold;margin:16px 0 6px;border-left:4px solid #1565c0;padding-left:10px',
    h3: 'font-size:19px;color:#1d4ed8;font-weight:bold;margin:14px 0 6px',
    h4: 'font-size:18px;color:#2563eb;font-weight:bold;margin:12px 0 5px',
    h5: 'font-size:17px;color:#3b82f6;font-weight:bold;margin:10px 0 4px',
    h6: 'font-size:16px;color:#60a5fa;font-weight:bold;margin:8px 0 3px',
    p: 'font-size:17px;color:#1a1a2e;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:16px;color:#5d4037;border-left:3px solid #ff9800;padding:8px 16px;margin:12px 0;background:#FFF8E1;border-radius:0 4px 4px 0',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#1a1a2e',
    img: 'max-width:100%;border-radius:6px;margin:12px 0',
    a: 'color:#1565c0;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#e3f2fd;padding:1px 5px;border-radius:3px;color:#1565c0',
    pre: 'background:#f5f7fa;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#1a1a2e;border:1px solid #e2e8f0',
    hr: 'border:0;border-top:1px solid #cbd5e1;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#e3f2fd;font-weight:bold;padding:8px 12px;border:0.5px solid #bbdefb;color:#1a1a2e',
    td: 'padding:8px 12px;border:0.5px solid #bbdefb;color:#1a1a2e',
    strong: 'font-weight:600;color:#0d47a1',
    em: 'font-style:italic;color:#546e7a',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fff9c4;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#5a8ec8'
  },
  forest_nature: {
    body: "background:#f3f8f4;font-family:'PingFang SC','Microsoft YaHei',KaiTi,serif;color:#2d3a2d;padding:20px 16px;max-width:100%",
    h1: 'font-size:32px;color:#2d6a4f;font-weight:bold;margin:16px 0 8px;border-bottom:2px solid #40916c;padding-bottom:8px',
    h2: 'font-size:22px;color:#1b4332;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:19px;color:#2d6a4f;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#40916c;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#52b788;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#74c69d;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#2d3a2d;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#4a5d4a;border-left:3px solid #40916c;padding:8px 16px;margin:12px 0;background:#e8f5e9',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#2d3a2d',
    img: 'max-width:100%;border-radius:8px;margin:12px 0',
    a: 'color:#2d6a4f;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#d8f3dc;padding:1px 5px;border-radius:3px;color:#2d6a4f',
    pre: 'background:#e8f5e9;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#2d3a2d;border:1px solid #c8e6c9',
    hr: 'border:0;border-top:1px solid #a5d6a7;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#d8f3dc;font-weight:bold;padding:8px 12px;border:0.5px solid #a5d6a7;color:#1b4332',
    td: 'padding:8px 12px;border:0.5px solid #a5d6a7;color:#2d3a2d',
    strong: 'font-weight:600;color:#1b4332',
    em: 'font-style:italic;color:#4a5d4a',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fff9c4;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#6b9e85'
  },
  orange_vibe: {
    body: "background:#fff8f3;font-family:'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif;color:#3d2e1f;padding:20px 16px;max-width:100%",
    h1: 'font-size:34px;color:#e8590c;font-weight:bold;margin:16px 0 8px;border-bottom:3px solid #ff922b;padding-bottom:8px',
    h2: 'font-size:24px;color:#d9480f;font-weight:bold;margin:14px 0 6px',
    h3: 'font-size:20px;color:#e8590c;font-weight:bold;margin:12px 0 4px',
    h4: 'font-size:18px;color:#f08c00;font-weight:bold;margin:10px 0 4px',
    h5: 'font-size:17px;color:#f59f00;font-weight:bold;margin:8px 0 3px',
    h6: 'font-size:16px;color:#faa419;font-weight:bold;margin:6px 0 3px',
    p: 'font-size:17px;color:#3d2e1f;line-height:1.8;margin:8px 0',
    blockquote: 'font-size:17px;color:#7a6248;border-left:3px solid #ff922b;padding:8px 16px;margin:12px 0;background:#fff0e0',
    ul: 'padding-left:24px;margin:8px 0',
    ol: 'padding-left:24px;margin:8px 0',
    li: 'margin:4px 0;font-size:17px;color:#3d2e1f',
    img: 'max-width:100%;border-radius:10px;margin:12px 0',
    a: 'color:#e8590c;text-decoration:underline',
    code: 'font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;background:#ffe8d6;padding:1px 5px;border-radius:3px;color:#e8590c',
    pre: 'background:#fff0e0;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:15px;font-family:Consolas,Monaco,"Courier New",monospace;line-height:1.6;margin:10px 0;color:#3d2e1f;border:1px solid #ffd8a8',
    hr: 'border:0;border-top:1px solid #ffc078;margin:16px 0',
    table: 'border-collapse:collapse;width:100%;margin:10px 0;font-size:15px',
    th: 'background:#ffe8d6;font-weight:bold;padding:8px 12px;border:0.5px solid #ffc078;color:#3d2e1f',
    td: 'padding:8px 12px;border:0.5px solid #ffc078;color:#3d2e1f',
    strong: 'font-weight:600;color:#d9480f',
    em: 'font-style:italic;color:#7a6248',
    del: 'text-decoration:line-through;opacity:0.7',
    mark: 'background:#fff3bf;padding:1px 3px;border-radius:2px',
    nestedList: 'margin-left:8px;font-size:15px',
    uiAccent: '#d49070'
  }
};

// ---------- Markdown → HTML（纯前端）----------
const buildHtml = (md, theme, overrides, brand) => {
  const base = THEMES[theme] || THEMES.serif_news;
  const t = { ...base };
  // 品牌色：重染强调色（标题 / 链接 / 引用分割线），正文与背景保留主题调性
  if (brand && brand.color) {
    ['h1', 'a', 'blockquote'].forEach(tag => {
      if (t[tag]) {
        t[tag] = t[tag]
          .replace(/color:[^;]+/, 'color:' + brand.color)
          // 只换边框颜色、保留主题的宽度/线型（避免整串替换把 3px solid 写死，
          // 否则其他主题的分隔线宽度/虚线样式会被品牌重染强制覆盖）
          .replace(/(border-left:[^;]*?)(#[0-9a-fA-F]{3,8})/i, '$1' + brand.color);
      }
    });
  }
  // 品牌字体：覆盖正文 font-family
  if (brand && brand.font) {
    t.body = t.body.replace(/font-family:[^;]+/, 'font-family:' + brand.font);
  }
  // 强制白底 + 深色正文，保证预览/导出与公众号白底阅读一致（所见即所得）
  t.body = t.body
    .replace(/background:[^;]+/, 'background:#ffffff')
    .replace(/color:[^;]+/, 'color:#1a1a1a');
  // 预处理：::: container 语法 → raw HTML div（marked 保留不处理，用户可见可编辑）
  md = md.replace(/::: (\w+)\n([\s\S]*?)\n:::/g, (_, type, content) =>
    `<div data-decor="${type}">${content.trim()}</div>`);

  let html = marked.parse(md);

  // 三层级联配色：主题 h1 强调色 → 品牌色覆盖 → 装饰渲染消费
  const themeAccent = (t.h1 || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#333';
  const quoteBg = (t.blockquote || '').match(/background:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || _brandShade(themeAccent, 82);
  const quoteText = (t.blockquote || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#555';
  const decorColor = brand?.color || themeAccent;

  // Post-process: 装饰容器 → 纯 CSS div / styled section（全部微信完美兼容，文字可选中可搜索）
  html = html.replace(/<div data-decor="cover">([\s\S]*?)<\/div>/g, (_, text) => buildCoverBlock(text.trim(), decorColor));
  html = html.replace(/<div data-decor="divider">[\s\S]*?<\/div>/g, () => buildDividerBlock(decorColor));
  html = html.replace(/<div data-decor="quote">([\s\S]*?)<\/div>/g, (_, text) => buildQuoteSection(text.trim(), decorColor, quoteBg, quoteText));

  // 给标签加内联样式（L1: h1-h6/p/blockquote 支持用户覆盖；L2: ul/ol/li/img/a/code/pre/hr/table/th/td 模板注入；L3: strong/em/del/mark 语义增强）
  const styleableTags = ['h1','h2','h3','h4','h5','h6','p','blockquote','ul','ol','li','img','a','code','pre','hr','table','th','td','strong','em','del','mark'];
  styleableTags.forEach(tag => {
    let style = t[tag] || '';
    if (overrides && overrides[tag]) {
      const ov = overrides[tag];
      const parts = [];
      if (ov['font-size']) parts.push(`font-size:${ov['font-size']}`);
      if (ov['color']) parts.push(`color:${ov['color']}`);
      if (ov['line-height']) parts.push(`line-height:${ov['line-height']}`);
      if (ov['letter-spacing']) parts.push(`letter-spacing:${ov['letter-spacing']}`);
      // 合并语义：用户覆盖叠在主题样式之上，而非整体替换
      // （否则只改 h1 颜色会丢失主题的字号/字重/下边框等整套样式，退化成浏览器默认 h1）
      if (parts.length) style = t[tag] ? t[tag] + ';' + parts.join(';') : parts.join(';');
    }
    if (style) {
      // 匹配「标签名 + 可选属性（含前导空格）」：旧正则 <tag(\s|)> 只能命中无属性标签，
      // 导致 <a href>、<img src>、<code class> 等带属性标签永远注入不了样式
      // （链接/图片/代码块样式、品牌色重染链接全部失效）。改用 (\s[^>]*)? 吞掉属性并保留。
      // 合并而非前置：若标签已有 style（如封面内嵌 <h1 style="margin:0;color">），
      // 主题样式在前、原 inline 在后，让内联的 margin:0/color 优先，且不会产生重复 style 属性
      html = html.replace(new RegExp(`<${tag}((?:\\s[^>]*)?)>`, 'g'), (_, attrs = '') =>
        /style="/.test(attrs)
          ? `<${tag}${attrs.replace(/style="([^"]*)"/, `style="${style};$1"`)}>`
          : `<${tag}${attrs} style="${style}">`
      );
    }
  });

  // Post-process A: 嵌套列表深度注入（二级 ul/ol 缩进 + 减小字号）
  // 注意：marked 渲染嵌套列表时，内层 <ul>/<ol> 紧跟在 <li> 文本之后（中间有文字、无空白），
  // 旧正则 /(<li[^>]*>)\s*(<(?:ul|ol))/ 要求 <li> 后紧跟空白再跟列表，实际 0 命中（功能从未生效）。
  // 改用负向前瞻 (?:(?!<\/li>)[\s\S])*? 限制只匹配「同一 <li> 内首个嵌套列表」，避免跨 <li> 误配。
  if (t.nestedList) {
    html = html.replace(/(<li[^>]*>)(?:(?!<\/li>)[\s\S])*?<(ul|ol)(\s[^>]*)?>/g, (_, li, list, attrs = '') => {
      const merged = attrs.includes('style=')
        ? attrs.replace(/style="([^"]*)"/, `style="$1;${t.nestedList}"`)
        : `${attrs} style="${t.nestedList}"`;
      return `${li}<${list}${merged}>`;
    });
  }

  // Post-process B: 表格偶数行斑马纹（微信兼容）
  // 斑马纹色从 body 背景派生：浅色底略深、深色底略浅，避免硬编码 #f9f9f9 在深色主题（如霓虹赛博）下刺眼；
  // wechat 模式 body 被强制白底，自然得到浅灰斑马纹。
  if (t.td) {
    let zebra = '#f4f4f4';
    const bgMatch = t.body.match(/background:\s*(#[0-9a-fA-F]{6})/);
    if (bgMatch) {
      const hex = bgMatch[1];
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      const lum = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      const d = lum >= 128 ? -10 : 18;
      const c = v => Math.max(0, Math.min(255, v + d)).toString(16).padStart(2, '0');
      zebra = '#' + c(r) + c(g) + c(b);
    }
    let isEven = false;
    html = html.replace(/<tr([^>]*)>/g, (_, attrs) => {
      if (isEven) {
        isEven = false;
        return `<tr${attrs} style="background-color:${zebra}">`;
      } else {
        isEven = true;
        return `<tr${attrs}>`;
      }
    });
  }

  return `<div style="${t.body}">${html}</div>`;
};

// 渲染 HTML（含品牌与预览模式）；复制/导出恒定微信白底
const currentBrand = () => ({
  color: brandColor.value,
  font: brandFont.value ? (BRAND_FONTS[brandFont.value] || '') : ''
});
const renderHtml = () =>
  DOMPurify.sanitize(buildHtml(markdownText.value, currentTheme.value, customOverrides.value, currentBrand()));

// ---------- Milkdown 编辑器：getMarkdown / themeToCss ----------
const getMarkdown = () => {
  if (!milkdownEditor) return markdownText.value;
  try {
    return milkdownEditor.action((ctx) => {
      const serializer = ctx.get(serializerCtx);
      const view = ctx.get(editorViewCtx);
      return serializer(view.state.doc);
    });
  } catch (e) {
    return markdownText.value;
  }
};

// 用 replaceAll 安全替换编辑器内容（外部按钮/AI/导入等统一入口）
const setEditorMarkdown = (md) => {
  if (milkdownEditor) {
    isSettingEditor = true;
    milkdownEditor.action(replaceAll(md));
    isSettingEditor = false;
  } else {
    markdownText.value = md;
  }
};

// 把 THEMES 转为 CSS 规则，注入 .milkdown-theme-editor 容器
// 与 buildHtml 共用同一份 THEMES + 品牌色 + 覆盖逻辑，保证所见即所得
const editorThemeCss = computed(() => {
  const base = THEMES[currentTheme.value] || THEMES.serif_news;
  const t = { ...base };
  const brand = currentBrand();

  // 装饰元素配色：与 buildHtml 完全一致（从 base 主题提取，避免品牌覆盖后错位）
  const themeAccent = (base.h1 || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#333';
  const quoteBg = (base.blockquote || '').match(/background:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || _brandShade(themeAccent, 82);
  const quoteText = (base.blockquote || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#555';
  const decorColor = brand.color || themeAccent;

  // 品牌色：重染强调色（与 buildHtml 完全一致）
  if (brand.color) {
    ['h1', 'a', 'blockquote'].forEach(tag => {
      if (t[tag]) {
        t[tag] = t[tag]
          .replace(/color:[^;]+/, 'color:' + brand.color)
          .replace(/(border-left:[^;]*?)(#[0-9a-fA-F]{3,8})/i, '$1' + brand.color);
      }
    });
  }
  if (brand.font) {
    t.body = t.body.replace(/font-family:[^;]+/, 'font-family:' + brand.font);
  }
  // 强制白底 + 深色正文（与 buildHtml 一致）
  t.body = t.body
    .replace(/background:[^;]+/, 'background:#ffffff')
    .replace(/color:[^;]+/, 'color:#1a1a1a');

  const styleableTags = ['h1','h2','h3','h4','h5','h6','p','blockquote','ul','ol','li','img','a','code','pre','hr','table','th','td','strong','em','del','mark'];
  const rules = [];

  // 容器样式（从 body 派生）+ 装饰元素 CSS 变量
  rules.push(`.milkdown-theme-editor { ${t.body}; min-height: 100%; --decor-color: ${decorColor}; --quote-bg: ${quoteBg}; --quote-text: ${quoteText}; }`);
  // Milkdown 编辑区容器
  rules.push(`.milkdown-theme-editor .milkdown { padding: 24px 32px; min-height: 100%; outline: none; }`);
  rules.push(`.milkdown-theme-editor .milkdown .ProseMirror { min-height: 100%; outline: none; }`);
  // 装饰元素在编辑器内的渲染样式
  rules.push(`.milkdown-theme-editor .milkdown-decor-cover { text-align: center; padding: 36px 20px 32px; margin: 32px 0; border-top: 3px solid var(--decor-color); border-bottom: 1px solid var(--decor-color); }`);
  rules.push(`.milkdown-theme-editor .milkdown-decor-cover h1 { margin: 0; color: var(--decor-color); }`);
  rules.push(`.milkdown-theme-editor .milkdown-decor-divider { text-align: center; color: var(--decor-color); font-size: 20px; letter-spacing: 14px; margin: 28px 0; line-height: 1; }`);
  rules.push(`.milkdown-theme-editor .milkdown-decor-quote { margin: 16px 0; padding: 20px 24px; border-radius: 8px; border-left: 4px solid var(--decor-color); background: var(--quote-bg); color: var(--quote-text); font-size: 17px; line-height: 1.8; }`);

  styleableTags.forEach(tag => {
    let style = t[tag] || '';
    // 用户覆盖（与 buildHtml 逻辑一致）
    if (customOverrides.value[tag]) {
      const ov = customOverrides.value[tag];
      const parts = [];
      if (ov['font-size']) parts.push(`font-size:${ov['font-size']}`);
      if (ov['color']) parts.push(`color:${ov['color']}`);
      if (ov['line-height']) parts.push(`line-height:${ov['line-height']}`);
      if (ov['letter-spacing']) parts.push(`letter-spacing:${ov['letter-spacing']}px`);
      if (parts.length) style = t[tag] ? t[tag] + ';' + parts.join(';') : parts.join(';');
    }
    if (style) {
      rules.push(`.milkdown-theme-editor ${tag} { ${style}; }`);
    }
  });

  return rules.join('\n');
});

// 注入/更新编辑器主题 CSS（watcher 方式，自动响应主题/品牌/覆盖变化）
watch(editorThemeCss, (css) => {
  let el = document.getElementById('milkdown-theme-css');
  if (!el) {
    el = document.createElement('style');
    el.id = 'milkdown-theme-css';
    document.head.appendChild(el);
  }
  el.textContent = css;
}, { immediate: true });

// ---------- 核心转换 ----------
const convertMarkdown = () => {
  try {
    previewHtml.value = renderHtml();
  } catch (error) {
    console.error('转换失败:', error);
    previewHtml.value = '<p style="color:#e03e3e;">⚠️ 内容解析失败，请检查 Markdown 语法</p>';
  }
};

// ---------- 应用自定义样式 ----------
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

// ---------- 重置单个标签 ----------
const resetTagStyle = () => {
  if (selectedTag.value) {
    delete customOverrides.value[selectedTag.value];
    saveToStorage();
    convertMarkdown();
    loadTagStyle();
  }
};

// ---------- 主题名映射 ----------
const THEME_NAMES = {
  serif_news: '经典报业',
  neon_tech: '霓虹赛博',
  mellow_pink: '温柔奶油',
  zen_minimal: '禅意极简',
  biz_blue: '商务蓝调',
  warm_coffee: '暖咖生活',
  ink_literati: '墨韵文心',
  study_notes: '学堂笔记',
  forest_nature: '森系自然',
  orange_vibe: '橘光活力'
};

// ---------- 全文一键套用主题 ----------
const applyThemeToAll = () => {
  customOverrides.value = {};
  saveToStorage();
  convertMarkdown();
  loadTagStyle();
  showToast('已套用「' + (THEME_NAMES[currentTheme.value] || '主题') + '」到全文', 'success');
};

// ---------- 品牌色 / 字体（Gamma 式重染）----------
const BRAND_FONTS = {
  serif: "'SimSun','Songti SC','Noto Serif SC',serif",
  sans: "'Microsoft YaHei','PingFang SC','Hiragino Sans GB',sans-serif",
  kai: "'KaiTi','STKaiti','Noto Serif SC',serif",
  deng: "'DengXian','PingFang SC','Microsoft YaHei',sans-serif"
};

const saveBrand = () => {
  localStorage.setItem('podcast_brand', JSON.stringify({ color: brandColor.value, font: brandFont.value }));
};

const applyBrand = () => {
  saveBrand();
  convertMarkdown();
};

const clearBrandColor = () => {
  brandColor.value = '';
  applyBrand();
};

// ---------- 装饰元素（纯前端，不联网）----------
// 颜色派生：主题色 / 品牌色 → HSL 暗 / 浅底
const _brandShade = (hex, dL = -10) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toHSL = (rr, gg, bb) => {
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rr: h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6; break;
        case gg: h = ((bb - rr) / d + 2) / 6; break;
        case bb: h = ((rr - gg) / d + 4) / 6; break;
      }
    }
    return [h * 360, s * 100, l * 100];
  };
  const toHex = (hh, ss, ll) => {
    ss = Math.max(0, Math.min(100, ss)) / 100;
    // 浅底上限 94%：避免品牌色偏亮时浅底被钳成纯白，失去品牌色调
    ll = Math.max(0, Math.min(94, ll)) / 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    return '#' + [hue2rgb(p, q, hue2rgb(p, q, hh + 1 / 3)), hue2rgb(p, q, hh), hue2rgb(p, q, hh - 1 / 3)]
      .map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  };
  const [h, s, l] = toHSL(r, g, b);
  return toHex(h / 360, s, l + dL);
};

// 封面卡片：纯 CSS（上下品牌色边线 + 居中标题，文字可选中可搜索，微信完美兼容）
// 嵌套 <h1> 让主题样式（字号/字重/字间距/字体）自动继承，覆盖项也能直接生效
const buildCoverBlock = (text, decorColor) => {
  return `<div style="text-align:center;padding:36px 20px 32px;margin:32px 0;border-top:3px solid ${decorColor};border-bottom:1px solid ${decorColor};"><h1 style="margin:0;color:${decorColor};">${text}</h1></div>`;
};

// 分割线：纯 CSS 字符（微信完美兼容，比 SVG 更轻更稳）
const buildDividerBlock = (decorColor) => {
  return `<div style="text-align:center;color:${decorColor};font-size:20px;letter-spacing:14px;margin:28px 0;line-height:1;">※ ※ ※</div>`;
};

// 金句卡片：styled section（微信对内联 style 支持更稳定，支持多行自动换行）
const buildQuoteSection = (text, decorColor, quoteBg, quoteText) => {
  return `<section style="margin:16px 0;padding:20px 24px;border-radius:8px;border-left:4px solid ${decorColor};background:${quoteBg};color:${quoteText};font-size:17px;line-height:1.8;">${text}</section>`;
};

// ---------- Milkdown 装饰节点插件（cover / divider / quote） ----------
// 让 ::: 容器语法在编辑器内可视化，并与 buildHtml 输出保持一致

// 从 remark-directive 容器中提取所有文本
const extractDirectiveText = (node) => {
  if (!node.children) return '';
  const texts = [];
  const walk = (n) => {
    if (n.type === 'text') texts.push(n.value);
    if (n.children) n.children.forEach(walk);
  };
  walk(node);
  return texts.join('');
};

const directiveRemark = $remark('decorDirective', () => remarkDirective);

const createDirectiveNode = (type) => $nodeSchema(`${type}Directive`, () => ({
  content: type === 'divider' ? '' : 'text*',
  group: 'block',
  attrs: {
    text: { default: '' },
  },
  parseMarkdown: {
    match: (node) => node.type === 'containerDirective' && node.name === type,
    runner: (state, node, treeType) => {
      const text = extractDirectiveText(node);
      state.openNode(treeType, { text });
      if (type !== 'divider') state.addText(text);
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (n) => n.type.name === `${type}Directive`,
    runner: (state, node) => {
      state.openNode('containerDirective', undefined, { name: type });
      if (type !== 'divider') {
        state.openNode('paragraph');
        state.addText(node.textContent || node.attrs.text || '');
        state.closeNode();
      }
      state.closeNode();
    },
  },
  toDOM: (node) => {
    if (type === 'cover') {
      return ['div', { class: 'milkdown-decor-cover', 'data-decor-type': 'cover' }, ['h1', 0]];
    }
    if (type === 'divider') {
      return ['div', { class: 'milkdown-decor-divider', 'data-decor-type': 'divider' }, ['span', '※ ※ ※']];
    }
    return ['section', { class: 'milkdown-decor-quote', 'data-decor-type': 'quote' }, 0];
  },
}));

const coverDirective = createDirectiveNode('cover');
const dividerDirective = createDirectiveNode('divider');
const quoteDirective = createDirectiveNode('quote');

const decorDirectivePlugin = [directiveRemark, coverDirective, dividerDirective, quoteDirective];

// 光标处插入装饰块（::: container 语法，编辑器内可视化）
const insertDecorBlock = (type) => {
  const labels = { cover: '封面卡片', divider: '分割线', quote: '金句卡片' };
  const content = type === 'divider'
    ? '\n::: divider\n\n:::\n'
    : `\n::: ${type}\n点击编辑文字\n:::\n`;

  if (milkdownEditor) {
    milkdownEditor.action(insert(content));
  } else {
    markdownText.value += content;
  }
  showToast(`已插入${labels[type] || '装饰元素'}`, 'success');
};

const insertImageByUrl = () => {
  if (!imageUrl.value.trim()) {
    showToast('请先粘贴图片链接', 'error');
    return;
  }
  insertImage(imageUrl.value.trim(), '图片');
  imageUrl.value = '';
  showToast('已插入图片', 'success');
};

// ---------- 插入图片到编辑器 ----------
const insertImage = (url, alt) => {
  const imageMarkdown = `\n![${alt || '图片'}](${url})\n`;
  if (milkdownEditor) {
    milkdownEditor.action(insert(imageMarkdown));
  } else {
    markdownText.value += imageMarkdown;
  }
  showToast('图片已插入', 'success');
};

// ---------- 清除内联样式 ----------
const clearInlineStyles = () => {
  const before = markdownText.value;
  const txt = before
    .replace(/\s+(style|class)\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/<\/?(font|span)\b[^>]*>/gi, '');
  if (txt !== before) {
    setEditorMarkdown(txt);
    showToast('已清除内联样式，排版更干净了', 'success');
  } else {
    showToast('当前内容没有内联样式，很干净 ✨', 'success');
  }
};

// ---------- 导入并提纯正文（纯本地）----------
const importFromText = () => {
  const raw = importText.value;
  if (!raw.trim()) {
    showToast('请先粘贴内容', 'error');
    return;
  }
  let md;
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    const cleaned = raw
      .replace(/\s+(style|class|width|height)\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/<\/?(font|span)\b[^>]*>/gi, '');
    const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    md = td.turndown(cleaned);
  } else {
    md = raw;
  }
  setEditorMarkdown(md.trim());
  importText.value = '';
  showToast('已提纯并填入编辑器', 'success');
};

// ---------- 复制 HTML ----------
const copyHtml = async () => {
  // 复制恒定微信白底
  const htmlToCopy = renderHtml();
  if (!htmlToCopy) {
    showToast('没有内容可复制', 'error');
    return;
  }
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = new Blob([htmlToCopy], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
      showToast('已复制！直接粘贴到微信公众号后台', 'success');
      return;
    }
    throw new Error('ClipboardItem 不可用');
  } catch (err) {
    // 兜底：把微信白底 HTML 放进隐藏节点，复制其富文本内容（微信可直接识别）
    try {
      const tmp = document.createElement('div');
      tmp.style.position = 'fixed';
      tmp.style.left = '-9999px';
      tmp.innerHTML = htmlToCopy;
      document.body.appendChild(tmp);
      const range = document.createRange();
      range.selectNodeContents(tmp);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(tmp);
      if (ok) {
        showToast('已复制！直接粘贴到微信公众号后台', 'success');
        return;
      }
      throw new Error('execCommand 复制失败');
    } catch (e2) {
      showToast('复制失败，请手动框选预览区内容复制', 'error');
      console.error(e2);
    }
  }
};

// ---------- 导出增强（纯本地）----------
const triggerDownload = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportHtmlFile = () => {
  if (!markdownText.value.trim()) {
    showToast('没有内容可导出', 'error');
    return;
  }
  // 导出恒定微信白底
  const safe = renderHtml();
  const doc =
    '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>净排导出</title>\n</head>\n<body style="margin:0;padding:0;">\n' +
    safe +
    '\n</body>\n</html>';
  triggerDownload(doc, '净排-导出.html', 'text/html');
  showToast('已导出 HTML 文件', 'success');
};

const exportMarkdown = () => {
  if (!markdownText.value.trim()) {
    showToast('没有内容可导出', 'error');
    return;
  }
  triggerDownload(markdownText.value, '净排-草稿.md', 'text/markdown');
  showToast('已导出 Markdown 文件', 'success');
};

const openWeChat = () => {
  window.open('https://mp.weixin.qq.com', '_blank');
  showToast('已打开微信后台，去粘贴并预览吧', 'success');
};

// ---------- AI 写作助手（用户自带 Key，纯前端直连）----------
const onAiPresetChange = () => {
  const p = AI_PRESETS[aiPreset.value];
  if (p && aiPreset.value !== 'custom') {
    aiBaseUrl.value = p.baseURL;
    aiModel.value = p.model;
  }
  saveAiConfig();
};

const saveAiConfig = () => {
  localStorage.setItem('podcast_ai_config', JSON.stringify({
    key: aiKey.value,
    preset: aiPreset.value,
    baseURL: aiBaseUrl.value,
    model: aiModel.value
  }));
};

const callAI = async (systemPrompt, userPrompt) => {
  if (!aiKey.value) {
    showToast('请先在 AI 设置里填你的 API Key', 'error');
    return null;
  }
  if (!aiBaseUrl.value) {
    showToast('请填写接口 Base URL（或选个预设）', 'error');
    return null;
  }
  aiLoading.value = true;
  try {
    const resp = await fetch(aiBaseUrl.value.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + aiKey.value
      },
      body: JSON.stringify({
        model: aiModel.value,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      })
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      console.error('AI 接口错误', resp.status, detail);
      showToast('接口返回 ' + resp.status + '，可能是 Key 无效或厂商禁止浏览器跨域', 'error');
      return null;
    }
    const data = await resp.json();
    return ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
  } catch (e) {
    console.error(e);
    showToast('调用失败：' + (e && e.message ? e.message : e) + '。若提示 CORS，请换 OpenRouter 预设或自建代理', 'error');
    return null;
  } finally {
    aiLoading.value = false;
  }
};

const aiGenerateTitle = async () => {
  const res = await callAI(
    '你是公众号爆款标题专家。根据文章内容，给出 3 个吸引点击的标题，每个一行，不要编号和符号。',
    markdownText.value.slice(0, 4000)
  );
  if (!res) return;
  const titles = res.split('\n').map(s => s.replace(/^#+\s*/, '').replace(/^[-\d.\s、]+/, '').trim()).filter(Boolean);
  if (!titles.length) return;
  const lines = markdownText.value.split('\n');
  const idx = lines.findIndex(l => /^#\s/.test(l));
  if (idx >= 0) lines[idx] = '# ' + titles[0];
  else lines.unshift('# ' + titles[0]);
  setEditorMarkdown(lines.join('\n'));
  showToast('已套用标题：' + titles[0] + (titles[1] ? '（其他：' + titles[1] + '）' : ''), 'success');
};

const aiWriteSummary = async () => {
  const res = await callAI(
    '你是公众号编辑。请用 100 字以内概括文章核心，输出一段纯文本摘要，不要标题。',
    markdownText.value.slice(0, 4000)
  );
  if (!res) return;
  const lines = markdownText.value.split('\n');
  const idx = lines.findIndex(l => /^#\s/.test(l));
  const summaryLine = '> ' + res.replace(/\n+/g, ' ').trim();
  if (idx >= 0) lines.splice(idx + 1, 0, '', '**摘要**', summaryLine, '');
  else lines.unshift('# 摘要', summaryLine, '');
  setEditorMarkdown(lines.join('\n'));
  showToast('已生成摘要', 'success');
};

const aiExpand = async () => {
  const sel = (window.getSelection && window.getSelection().toString().trim()) || '';
  const source = sel || markdownText.value;
  const label = sel ? '选中内容' : '全文';
  const res = await callAI(
    '你是公众号写手。请在不改变原意的前提下，把下面内容扩写到约 1.5-2 倍长度，保持 Markdown 格式，语言更生动。',
    source.slice(0, 4000)
  );
  if (!res) return;
  if (sel) {
    setEditorMarkdown(markdownText.value.split(sel).join(res));
  } else {
    setEditorMarkdown(markdownText.value + '\n\n' + res);
  }
  showToast('已扩写' + label, 'success');
};

const aiStructure = async () => {
  const res = await callAI(
    '你是公众号排版专家。请对下面的 Markdown 文章做结构化优化：补充小标题、合理分段、把重点加粗、必要时加引用和列表，输出干净且适合公众号的 Markdown。只输出正文，不要解释。',
    markdownText.value.slice(0, 6000)
  );
  if (!res) return;
  if (window.confirm('一键排版将用 AI 结果替换当前全文，确定继续？')) {
    setEditorMarkdown(res.trim());
    showToast('已按公众号结构重排全文', 'success');
  }
};

// ---------- 主题切换 ----------
const onThemeChange = () => {
  convertMarkdown();
  saveSettings();
};

// ---------- 主题自定义下拉 ----------
const showThemeDropdown = ref(false);
const selectTheme = (key) => {
  if (currentTheme.value !== key) {
    currentTheme.value = key;
    onThemeChange();
  }
  showThemeDropdown.value = false;
};
const toggleThemeDropdown = () => {
  showThemeDropdown.value = !showThemeDropdown.value;
};

// ---------- 监听编辑器内容变化 ----------
// 异步 watch：更新预览 + 保存草稿（保持原有行为）
watch(markdownText, () => {
  convertMarkdown();
  saveDraft();
});

// 同步 watch：外部修改 markdownText 时推送到 Milkdown 编辑器
// 编辑器内部修改时 isFromEditor=true，跳过推送避免循环
watch(markdownText, (newMd) => {
  if (!isFromEditor && milkdownEditor) {
    isSettingEditor = true;
    milkdownEditor.action(replaceAll(newMd));
    isSettingEditor = false;
  }
}, { flush: 'sync' });

// 监听设置变化
watch([previewPosition, previewWidth, phoneModel, showPreview], () => {
  saveSettings();
});

// ---------- 初始化 ----------
onMounted(async () => {
  loadFromStorage();
  // 移动端默认隐藏预览
  if (window.matchMedia('(max-width: 768px)').matches) {
    showPreview.value = false;
  }

  // 初始化 Milkdown 编辑器
  try {
    milkdownEditor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, milkdownContainer.value);
        ctx.set(defaultValueCtx, markdownText.value);
        // listener: 编辑器内容变化 → 同步到 markdownText
        ctx.get(listenerCtx).markdownUpdated((_, md) => {
          if (isSettingEditor) return;
          isFromEditor = true;
          markdownText.value = md;
          isFromEditor = false;
        });
      })
      .use(listener)
      .use(commonmark)
      .use(gfm)
      .use(decorDirectivePlugin)
      .create();
  } catch (e) {
    console.error('Milkdown 初始化失败:', e);
  }

  convertMarkdown();
  setInterval(() => { now.value = Date.now(); }, 15000);
  if (showRecoveryBanner.value) {
    setTimeout(() => { showRecoveryBanner.value = false; }, 10000);
  }
});

onUnmounted(() => {
  milkdownEditor?.destroy();
  milkdownEditor = null;
});
</script>

<style>
/* ========== Notion 风格全局变量 ========== */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f6fa;
  --bg-hover: #f0eef6;
  --bg-active: #e8e4f0;
  
  --text-primary: #37352f;
  --text-secondary: #787774;
  --text-tertiary: #6b6b6b;

  --border-light: #eceaf2;
  --border-medium: #e3e0ec;

  --accent-blue: #2383e2;
  --accent-green: #07c160;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text-primary);
  background: var(--bg-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-root {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* ========== 左侧工具栏 ========== */
.left-toolbar {
  width: 72px;
  background: var(--bg-primary);
  border-right: 0.5px solid var(--border-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  flex-shrink: 0;
  z-index: 50;
}

.toolbar-brand {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.brand-icon {
  font-size: 22px;
}

.toolbar-divider {
  width: 28px;
  height: 1px;
  background: var(--border-light);
  margin: 8px 0;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-item {
  width: 40px;
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  transition: background var(--transition-fast);
}

.toolbar-item:hover {
  background: var(--bg-hover);
}

.toolbar-item.active {
  background: var(--bg-active);
}

.toolbar-item:focus-visible {
  outline: 2px solid var(--accent-green);
  outline-offset: 2px;
}

.toolbar-item .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

/* 工具栏文字标签（桌面端常驻，移动端隐藏） */
.toolbar-item .toolbar-label {
  font-size: 11px;
  color: var(--text-secondary, #787774);
  line-height: 1;
  pointer-events: none;
}

.toolbar-item .tooltip {
  position: absolute;
  left: 48px;
  background: var(--text-primary);
  color: white;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
  z-index: 100;
}

.toolbar-item:hover .tooltip {
  opacity: 1;
}

/* 段组小标题 */
.toolbar-section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 4px 0 2px;
  pointer-events: none;
}

/* ========== 悬浮面板 ========== */
.floating-panel {
  position: fixed;
  left: 72px;
  top: 0;
  bottom: 0;
  width: 300px;
  background: var(--bg-primary);
  border-right: 0.5px solid var(--border-light);
  box-shadow: 4px 0 20px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  z-index: 40;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 0.5px solid var(--border-light);
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.panel-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.panel-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 样式面板内的「整体风格」分组，与逐元素微调区分 */
.panel-section {
  border-bottom: 1px solid var(--border-light, #eceaf2);
  padding-bottom: 16px;
  margin-bottom: 16px;
}
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

/* ========== 主体布局 ========== */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-width: 0;
}

.main-content.preview-left {
  flex-direction: row-reverse;
}

.main-content.preview-hidden {
  flex-direction: row;
}

/* 桌面端面板改为 push：打开时主内容右移让出面板宽度，编辑器与预览完整露出 */
@media (min-width: 769px) {
  .main-content.panel-open {
    margin-left: 320px;
    transition: margin-left var(--transition-normal);
  }
}

/* ========== 编辑器区域 ========== */
.editor-section {
  flex: 1;
  min-width: 0;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

/* ========== 拖拽分隔线 ========== */
.resize-handle {
  width: 6px;
  background: var(--bg-hover);
  cursor: col-resize;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.resize-handle:hover {
  background: var(--bg-active, #e8e4f0);
}

.resize-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 32px;
  background: var(--border-light);
  border-radius: 2px;
}

.resize-handle:hover::before {
  background: var(--border-medium, #e3e0ec);
}

/* ========== 预览区域 ========== */
.preview-section {
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-light);
  flex-shrink: 0;
}

.preview-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.preview-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-btn-group {
  display: flex;
  gap: 2px;
}

.preview-btn {
  padding: 4px 10px;
  font-size: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.preview-btn:hover {
  background: var(--bg-hover);
}

.preview-btn.active {
  background: var(--text-primary);
  color: white;
  border-color: var(--text-primary);
}

.preview-btn-group .preview-btn {
  border-radius: 0;
}

.preview-btn-group .preview-btn:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.preview-btn-group .preview-btn:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.preview-btn-group .preview-btn.active {
  background: var(--text-primary);
  color: white;
  border-color: var(--text-primary);
}

.phone-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.phone-frame {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 0.5px solid var(--border-medium);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: width 0.2s ease;
}

.phone-frame.iphone-se { width: 375px; }
.phone-frame.iphone-14 { width: 390px; }
.phone-frame.iphone-14pm { width: 430px; }
.phone-frame.android-small { width: 360px; }
.phone-frame.android-large { width: 412px; }

.phone-wechat-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 12px;
  background: #ededed;
  border-bottom: 0.5px solid #e0e0e0;
  user-select: none;
}

.phone-wechat-bar .wechat-title {
  font-size: 12px;
  font-weight: 500;
  color: #191919;
  pointer-events: none;
}

.wechat-back, .wechat-menu {
  flex-shrink: 0;
}

.phone-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  font-size: 17px;
  line-height: 1.8;
  color: #3e3e3e;
  padding: 16px;
}

.phone-content::-webkit-scrollbar {
  width: 4px;
}

.phone-content::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 4px;
}

.phone-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ========== 控件样式 ========== */
.control-group {
  margin-bottom: 20px;
}

.control-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-value {
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 45px;
  text-align: right;
}

.notion-range {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--border-light);
  border-radius: 2px;
  cursor: pointer;
}

.notion-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--bg-primary);
  border: 2px solid var(--accent-blue);
  border-radius: 50%;
  cursor: pointer;
}

.notion-color {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: var(--bg-primary);
}

.notion-color::-webkit-color-swatch-wrapper {
  padding: 0;
}

.notion-color::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

/* ========== Notion 风格选择器 ========== */
.notion-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.notion-select:hover {
  border-color: var(--border-medium);
}

.notion-select:focus {
  outline: none;
  border-color: var(--accent-blue);
}

/* ========== 主题选择器（自定义下拉 + 色块）========== */
.theme-picker {
  position: relative;
  user-select: none;
}
.theme-picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 0.5px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}
.theme-picker-trigger:hover {
  border-color: var(--border-medium);
}
.theme-picker:focus-within .theme-picker-trigger {
  border-color: var(--accent-blue);
}
.theme-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.theme-picker-label {
  flex: 1;
  text-align: left;
}
.theme-picker-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform var(--transition-fast);
}
.theme-picker-arrow.open {
  transform: rotate(180deg);
}
.theme-picker-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 0.5px solid var(--border-light);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}
.theme-picker-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.theme-picker-option:hover {
  background: var(--bg-hover);
}
.theme-picker-option.active {
  background: var(--bg-active);
  font-weight: 500;
}

/* ========== Notion 风格输入框 ========== */
.notion-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
}

.notion-input:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.notion-input::placeholder {
  color: var(--text-tertiary);
}

/* ========== Notion 风格按钮 ========== */
.notion-btn-text {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.notion-btn-text:hover {
  color: var(--text-primary);
}

.notion-btn-small {
  padding: 6px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast);
}

.notion-btn-small:hover {
  background: var(--bg-hover);
}

/* ========== 搜索框 ========== */
.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-box .notion-input {
  flex: 1;
}

/* ========== Toast 通知 ========== */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  background: var(--text-primary);
  color: white;
  border-radius: var(--radius-md);
  font-size: 14px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.toast.error {
  background: #dc2626;
}

/* ========== 过渡动画 ========== */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* ========== 状态栏 ========== */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.status-privacy {
  color: var(--accent-green);
  white-space: nowrap;
  font-size: 12px;
}

/* ========== 恢复横幅 ========== */
.recovery-banner {
  position: fixed;
  top: 0;
  left: 52px;
  right: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--text-primary);
  color: #fff;
  font-size: 13px;
  box-shadow: var(--shadow-md);
}

.banner-close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.banner-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* ========== 装饰元素网格 ========== */
.decor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.decor-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.decor-item:hover {
  background: var(--bg-active);
  border-color: var(--border-medium);
  color: var(--text-primary);
}

.decor-icon {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.decor-item:hover .decor-icon {
  color: var(--text-primary);
}

.decor-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.decor-meta {
  font-size: 10px;
  color: var(--text-tertiary);
}

.panel-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.6;
  margin-bottom: 16px;
}

/* ========== 导入面板 ========== */
.import-textarea {
  width: 100%;
  min-height: 140px;
  padding: 10px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  color: var(--text-primary);
  resize: vertical;
  line-height: 1.6;
}

.import-textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.import-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.notion-btn-small.primary {
  background: var(--accent-green);
  color: #fff;
  border-color: var(--accent-green);
}

.notion-btn-small.primary:hover {
  opacity: 0.9;
}

.notion-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 导出 / AI 面板按钮 ========== */
.export-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-actions .notion-btn-small {
  justify-content: center;
  text-align: center;
}

.ai-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.ai-actions .notion-btn-small {
  justify-content: center;
  text-align: center;
}

/* ========== 套用全部按钮 ========== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.apply-all-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: var(--accent-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: opacity var(--transition-fast);
}

.apply-all-btn:hover {
  opacity: 0.9;
}

.panel-hint {
  padding: 8px 20px;
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border-bottom: 0.5px solid var(--border-light);
}

/* ========== 移动端预览浮钮 ========== */
.mobile-preview-fab {
  display: none;
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 120;
  padding: 8px 14px;
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

/* ========== 移动端窄屏适配 ========== */
@media (max-width: 768px) {
  .left-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    width: 100%;
    height: auto;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 6px 4px;
    border-right: none;
    border-top: 1px solid var(--border-light);
    z-index: 100;
  }

  .toolbar-brand,
  .toolbar-divider {
    display: none;
  }

  .toolbar-spacer {
    display: none;
  }

  .toolbar-section-label,
  .toolbar-item .toolbar-label {
    display: none;
  }

  .toolbar-item {
    width: 40px;
    height: 40px;
  }

  .toolbar-item .tooltip {
    left: 50%;
    top: -38px;
    bottom: auto;
    transform: translateX(-50%);
  }

  .floating-panel {
    left: 0;
    width: 100%;
    top: 0;
    bottom: 56px;
  }

  .main-content {
    flex-direction: column;
  }

  /* 预览区在移动端变成全屏覆盖层，由浮钮/工具栏切换显隐 */
  .preview-section {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 56px;
    width: 100% !important;
    z-index: 60;
    background: var(--bg-secondary);
  }

  .resize-handle {
    display: none;
  }

  .recovery-banner {
    left: 0;
  }

  .status-bar {
    font-size: 11px;
  }

  .status-privacy {
    display: none;
  }

  .mobile-preview-fab {
    display: flex;
    align-items: center;
  }

  .phone-frame.iphone-se,
  .phone-frame.iphone-14,
  .phone-frame.iphone-14pm,
  .phone-frame.android-small,
  .phone-frame.android-large {
    width: 100%;
    max-width: 430px;
  }
}
</style>

<style scoped>
/* ========== Milkdown 编辑器样式 ========== */
.milkdown-theme-editor {
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
}

:deep(.milkdown) {
  min-height: 100%;
  outline: none;
}

:deep(.milkdown .ProseMirror) {
  min-height: 100%;
  outline: none;
  word-wrap: break-word;
  white-space: pre-wrap;
}

:deep(.milkdown .ProseMirror:focus) {
  outline: none;
}

/* 占位符样式（空文档时显示） */
:deep(.milkdown .ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-tertiary);
  pointer-events: none;
  height: 0;
}

/* 选区颜色 */
:deep(.milkdown .ProseMirror ::selection) {
  background: rgba(35, 131, 226, 0.15);
}
</style>
