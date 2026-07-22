<template>
  <div class="app-root">
    <!-- 恢复草稿横幅 -->
    <Transition name="banner-slide">
      <div v-if="showRecoveryBanner" class="recovery-banner">
        <span>👋 欢迎回来，已为你恢复上次没写完的草稿。放心，它一直只躺在你的设备上，从没上传过任何服务器。</span>
        <button class="banner-close" @click="showRecoveryBanner = false">×</button>
      </div>
    </Transition>

    <!-- 新手引导浮层 -->
    <Transition name="fade">
      <div v-if="showOnboarding" class="onboarding-overlay">
        <div class="onboarding-card" role="dialog" aria-modal="true" aria-label="新手引导">
          <!-- 步骤指示器 -->
          <div class="onboarding-steps">
            <span
              v-for="s in 4" :key="s"
              class="onboarding-dot"
              :class="{ active: onboardingStep === s, done: onboardingStep > s }"
            ></span>
          </div>

          <!-- 步骤 1：写作 + 预览 -->
          <div v-if="onboardingStep === 1" class="onboarding-body">
            <div class="onboarding-icon">✍️</div>
            <h3>用 Markdown 写作，实时预览公众号样式</h3>
            <p>左边写 Markdown，右边手机框里就是公众号发布后的样子，所见即所得。</p>
          </div>

          <!-- 步骤 2：选主题 -->
          <div v-if="onboardingStep === 2" class="onboarding-body">
            <div class="onboarding-icon">🎨</div>
            <h3>10 套主题，一键铺满全文</h3>
            <p>点击左侧「外观」选主题，排版风格一步到位。字体、配色、间距，全自动搞定。</p>
          </div>

          <!-- 步骤 3：复制发布 -->
          <div v-if="onboardingStep === 3" class="onboarding-body">
            <div class="onboarding-icon">📋</div>
            <h3>复制 HTML，粘贴微信即发布</h3>
            <p>点「复制 HTML」→ 去微信后台粘贴 → 封面/分割线/金句全部自动生效。</p>
          </div>

          <!-- 步骤 4：功能一览 -->
          <div v-if="onboardingStep === 4" class="onboarding-body">
            <div class="onboarding-icon">🚀</div>
            <h3>净排为你准备了这些好用的功能</h3>
            <div class="onboarding-tags">
              <span class="onboarding-tag">🎨 10 套主题</span>
              <span class="onboarding-tag">🖼️ 装饰元素</span>
              <span class="onboarding-tag">🤖 AI 写作</span>
              <span class="onboarding-tag">📋 一键复制</span>
              <span class="onboarding-tag">🔒 纯本地</span>
              <span class="onboarding-tag">📱 手机预览</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="onboarding-actions">
            <button
              v-if="onboardingStep < 3"
              class="onboarding-next"
              @click="onboardingStep++"
            >下一步</button>
            <button
              v-if="onboardingStep === 3"
              class="onboarding-next"
              @click="onboardingStep++"
            >看看还有什么 ▸</button>
            <button
              v-if="onboardingStep === 4"
              class="onboarding-next onboarding-done"
              @click="finishOnboarding"
            >开始创作</button>
            <button class="onboarding-skip" @click="skipOnboarding">跳过引导</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 快捷键帮助浮层 -->
    <Transition name="panel-slide">
      <div v-if="showShortcuts" class="shortcuts-overlay" @click.self="showShortcuts = false">
        <div class="shortcuts-card" role="dialog" aria-modal="true" aria-label="键盘快捷键">
          <div class="panel-header">
            <h3>键盘快捷键</h3>
            <button @click="showShortcuts = false" class="panel-close" aria-label="关闭">×</button>
          </div>
          <div class="panel-content">
            <ul class="shortcuts-list">
              <li><kbd>⌃</kbd> + <kbd>⇧</kbd> + <kbd>C</kbd><span>复制 HTML 到剪贴板</span></li>
              <li><kbd>⌃</kbd> + <kbd>⇧</kbd> + <kbd>P</kbd><span>切换预览</span></li>
              <li><kbd>⌃</kbd> + <kbd>S</kbd><span>保存草稿到本机</span></li>
              <li><kbd>⌃</kbd> + <kbd>Z</kbd><span>撤销</span></li>
              <li><kbd>⌃</kbd> + <kbd>/</kbd><span>打开 / 关闭本帮助</span></li>
            </ul>
            <p class="panel-tip">编辑器内 Ctrl/Cmd+B 加粗、+I 倾斜等 Markdown 快捷键由编辑器原生支持，此处不再重复。</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 左侧图标工具栏 -->
    <div class="left-toolbar">
      <div class="toolbar-brand">
        <span class="brand-icon">📐</span>
      </div>

      <!-- ===== 写作区 ===== -->
      <div class="toolbar-group">
        <span class="toolbar-group-label">写作</span>
        <!-- 撤销（放明面上） -->
        <div
          class="toolbar-item"
          role="button"
          @click="milkdownEditor?.action(undoCommand())"
          title="撤销 (Ctrl+Z)"
          aria-label="撤销"
        >
          <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h7a3 3 0 0 1 0 6H7M4 5l2.5-2.5M4 5l2.5 2.5"/></svg></span>
          <span class="toolbar-label">撤销</span>
          <span class="tooltip">撤销 (Ctrl+Z)</span>
        </div>
        <!-- 导入 -->
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
      </div>

      <!-- ===== 排版区 ===== -->
      <div class="toolbar-group">
        <span class="toolbar-group-label">排版</span>
        <!-- 外观（主题 + 品牌 + 微调 统一面板） -->
        <div
          class="toolbar-item"
          role="button"
          :class="{ active: activePanel === 'appearance' }"
          @click="togglePanel('appearance')"
          title="外观：主题 / 品牌 / 微调"
          aria-label="外观：主题、品牌、微调"
        >
          <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M12.5 3c.35.45.7.95 1 1.5M3.5 3c-.35.45-.7.95-1 1.5"/><path d="M2.5 12c.32-.45.67-.86 1.05-1.24M13.5 12c-.32-.45-.67-.86-1.05-1.24"/><path d="M13.5 4c-.32.45-.67.86-1.05 1.24M2.5 4c.32.45.67.86 1.05 1.24"/></svg></span>
          <span class="toolbar-label">外观</span>
          <span class="tooltip">外观：主题 / 品牌 / 微调</span>
        </div>
        <!-- 装饰元素（B1 解耦：纯装饰，与图片无关） -->
        <div
          class="toolbar-item"
          role="button"
          :class="{ active: activePanel === 'image' }"
          @click="togglePanel('image')"
          title="装饰元素"
          aria-label="装饰元素"
        >
          <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><circle cx="5" cy="6" r="1.2"/><path d="M1.5 11.5l3-2.5 2.5 2 3.5-4 3.5 3"/></svg></span>
          <span class="toolbar-label">装饰</span>
          <span class="tooltip">装饰元素：封面 / 分割线 / 金句</span>
        </div>
      </div>

      <!-- ===== 增强区 ===== -->
      <div class="toolbar-group">
        <span class="toolbar-group-label">增强</span>
        <!-- AI 写作（核心功能独立） -->
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
      </div>

      <!-- ===== 发布区 ===== -->
      <div class="toolbar-group">
        <span class="toolbar-group-label">发布</span>
        <!-- 预览 -->
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
        <!-- 复制 HTML -->
        <div
          class="toolbar-item"
          role="button"
          @click="copyHtml"
          title="复制 HTML"
          aria-label="复制 HTML"
        >
          <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="1.5" width="10" height="12" rx="1.5"/><path d="M10.5 5v7M5.5 5v7"/></svg></span>
          <span class="toolbar-label">复制</span>
          <span class="tooltip">复制 HTML (⇧⌘C)</span>
        </div>
        <!-- 导出 -->
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
        <!-- 打开微信后台（发布闭环入口，B4） -->
        <div
          class="toolbar-item"
          role="button"
          @click="openWeChat"
          title="打开微信后台"
          aria-label="打开微信后台"
        >
          <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5C2 5.5 4.7 3 8 3s6 2.5 6 5.5S11.3 14 8 14c-.9 0-1.7-.2-2.4-.5L3.5 14l.6-2C2.9 11.2 2 9.9 2 8.5z"/><circle cx="6" cy="8" r=".55" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r=".55" fill="currentColor" stroke="none"/></svg></span>
          <span class="toolbar-label">微信</span>
          <span class="tooltip">打开微信后台粘贴发布</span>
        </div>
      </div>

      <!-- ===== 系统区 ===== -->
      <div class="toolbar-group">
        <span class="toolbar-group-label">系统</span>
        <!-- 清除样式 -->
        <div
          class="toolbar-item"
          role="button"
          @click="clearInlineStyles"
          title="清除内联样式"
          aria-label="清除内联样式"
        >
          <span class="icon"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5H3.5A1.5 1.5 0 002 4v2M10.5 2.5h1.5A1.5 1.5 0 0113.5 4v2M3 13.5l2-2.5 2 3 3-4.5 3.5 4.5M2 12V3"/></svg></span>
          <span class="toolbar-label">清除</span>
          <span class="tooltip">清除内联样式</span>
        </div>
        <!-- 外观模式：三态分段控件 (B3) -->
        <ThemeModeSwitch :model-value="themeMode" @select="setThemeMode" />
      </div>
    </div>

    <!-- 悬浮面板：外观（B5 统一：主题 + 品牌 + 微调） -->
    <Transition name="panel-slide">
      <div v-show="activePanel === 'appearance'">
        <AppearancePanel
          :current-theme="currentTheme"
          v-model:selected-tag="selectedTag"
          v-model:temp-font-size="tempFontSize"
          v-model:temp-color="tempColor"
          v-model:temp-line-height="tempLineHeight"
          v-model:temp-letter-spacing="tempLetterSpacing"
          v-model:brand-color="brandColor"
          v-model:brand-font="brandFont"
          v-model:phone-model="phoneModel"
          @select-theme="selectTheme"
          @load-tag-style="loadTagStyle"
          @apply-style="applyCustomStyle"
          @apply-all="applyThemeToAll"
          @reset-tag="resetTagStyle"
          @apply-brand="applyBrand"
          @clear-brand="clearBrandColor"
          @clear-brand-font="clearBrandFont"
          @close="activePanel = null"
        />
      </div>
    </Transition>

    <!-- 悬浮面板：装饰 -->
    <Transition name="panel-slide">
      <div v-show="activePanel === 'image'" class="floating-panel">
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
              <span class="decor-meta">顶部封面 · 标题区</span>
            </button>
            <button class="decor-item" @click="insertDecorBlock('divider')">
              <span class="decor-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="10" x2="8" y2="10"/><circle cx="10" cy="10" r="2"/><line x1="12" y1="10" x2="18" y2="10"/></svg></span>
              <span class="decor-name">分割线</span>
              <span class="decor-meta">段落之间 · 轻柔分隔</span>
            </button>
            <button class="decor-item" @click="insertDecorBlock('quote')">
              <span class="decor-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4v4H2v5h5V7H5V4zM15 4v4h-3v5h5V7h-2V4z"/></svg></span>
              <span class="decor-name">金句卡片</span>
              <span class="decor-meta">自适应 · 金句装点</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮面板：导入文章 -->
    <Transition name="panel-slide">
      <div v-show="activePanel === 'import'" class="floating-panel">
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
      <div v-show="activePanel === 'ai'">
        <AIPanel
          v-model:ai-preset="aiPreset"
          v-model:ai-key="aiKey"
          v-model:ai-base-url="aiBaseUrl"
          v-model:ai-model="aiModel"
          :ai-loading="aiLoading"
          :ai-recommendations="aiRecommendations"
          :ai-intro-seen="aiIntroSeen"
          @dismiss-ai-intro="dismissAiIntro"
          @run-action="runAiAction"
          @close="activePanel = null"
          @cancel="cancelAI"
        />
      </div>
    </Transition>

    <!-- 悬浮面板：导出 -->
    <Transition name="panel-slide">
      <div v-show="activePanel === 'export'">
        <ExportPanel
          @export-html="exportHtmlFile"
          @export-markdown="exportMarkdown"
          @open-we-chat="openWeChat"
          @close="activePanel = null"
        />
      </div>
    </Transition>

    <!-- 主体区域 -->
    <main class="main-content" :class="{ 'preview-left': previewPosition === 'left', 'preview-hidden': !showPreview, 'panel-open': !!activePanel }">
      <!-- 预览区 -->
        <PreviewPanel
          :show-preview="showPreview"
          :preview-width="previewWidth"
          v-model:preview-position="previewPosition"
          v-model:show-preview="showPreview"
          v-model:preview-wechat-dark="previewWechatDark"
        :preview-html="previewHtml"
        :markdown-text="markdownText"
        :phone-model="phoneModel"
        @load-sample-article="loadSampleArticle"
      />

      <!-- 拖拽分隔线（Pointer Events 统一鼠标/触屏） -->
      <div 
        v-if="showPreview" 
        class="resize-handle"
        @pointerdown="startResize"
      ></div>

      <!-- 编辑器区域 -->
      <section class="editor-section">
        <!-- 上下文工具栏（选区即操作） -->
        <Transition name="slide-down">
          <div v-if="selectedType" class="context-bar">
            <!-- 选中标题 -->
            <template v-if="selectedType === 'heading'">
              <span class="context-label">标题</span>
              <button class="context-btn" @click="setHeadingLevel(1)">H1</button>
              <button class="context-btn" @click="setHeadingLevel(2)">H2</button>
              <button class="context-btn" @click="setHeadingLevel(3)">H3</button>
            </template>
            <!-- 选中文字：≥10 字给 AI 操作；短文给格式化操作（避免空白死路） -->
            <template v-if="selectedType === 'text'">
              <span class="context-label">文字 ({{ selectionLength }}字)</span>
              <template v-if="selectionLength >= 10">
                <button class="context-btn" @click="aiExpand">⚡扩写</button>
                <button class="context-btn" @click="aiRewrite">🔄改写</button>
                <button class="context-btn" @click="aiTranslate">🌐翻译</button>
              </template>
              <template v-else>
                <button class="context-btn" @click="formatBold" title="加粗"><b>B</b></button>
                <button class="context-btn" @click="formatItalic" title="斜体"><i>I</i></button>
                <button class="context-btn" @click="formatLink" title="插入链接">🔗</button>
              </template>
            </template>
            <button class="context-close" @click="selectedType = null" title="关闭">×</button>
          </div>
        </Transition>
        <div class="editor-container">
          <div class="milkdown-theme-editor" ref="milkdownContainer"></div>
        </div>
        <div class="status-bar">
          <span class="status-item">{{ wordCount }} 字</span>
          <span class="status-sep">·</span>
          <span class="status-item">约 {{ readTime }} 分钟</span>
          <span class="status-sep">·</span>
          <span class="status-item">🔒 {{ savedLabel }}</span>
          <span v-if="aiLoading" class="status-item ai-status">
            <span class="ai-spinner"></span>AI 写作中…
          </span>
        </div>
      </section>
    </main>

    <!-- Toast 通知 -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </Transition>

    <!-- B4：复制成功后的发布闭环轻引导（常驻） -->
    <PublishWizard
      :visible="publishGuide"
      @close="publishGuide = false"
      @open-wechat="openWeChat"
    />

    <!-- 移动端预览浮钮 -->
    <button class="mobile-preview-fab" @click="showPreview = !showPreview">
      {{ showPreview ? '✏️ 编辑' : '👁 预览' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx, commandsCtx } from '@milkdown/kit/core';
import { commonmark, toggleStrongCommand, toggleEmphasisCommand, toggleLinkCommand } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { replaceAll, replaceRange, $nodeSchema, $remark } from '@milkdown/kit/utils';
import { history, undoCommand } from '@milkdown/plugin-history';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { headingEnterFix } from './plugins/headingEnterFix.js';
import { forceParagraphEnter } from './plugins/forceParagraphEnter.js';

// composables
import { useDraft } from './composables/useDraft.js';
import { useBrand } from './composables/useBrand.js';
import { useStyle } from './composables/useStyle.js';
import PreviewPanel from './components/PreviewPanel.vue';
import AIPanel from './components/AIPanel.vue';
import AppearancePanel from './components/AppearancePanel.vue';
import ExportPanel from './components/ExportPanel.vue';
import PublishWizard from './components/PublishWizard.vue';
import ThemeModeSwitch from './components/ThemeModeSwitch.vue';
import remarkDirectivePlugin from 'remark-directive';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import { THEMES } from './themes.js';
import { deriveDarkTheme } from './darkTheme.js';
import { buildHtml, stripBareDirectives, _brandShade, applyBrandToTheme } from './buildHtml.js';
import { callAI as _extCallAI } from './callAI.js';

// remark-directive 必须用 $remark 包装：内部访问 self.data()，只有经 unified 调用才能拿到正确 this
const remarkDirective = $remark('remarkDirective', () => remarkDirectivePlugin);

// ---------- Toast 通知 ----------
const toast = ref({ show: false, message: '', type: 'success' });
// B4：复制成功后的发布闭环轻引导（常驻，直到用户关闭或再次复制）
const publishGuide = ref(false);

const showToast = (message, type = 'success', duration = 2500) => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, duration);
};

// ---------- 面板控制 ----------
const activePanel = ref(null);
const showPreview = ref(true);
const showShortcuts = ref(false);

// 外观模式：light / dark / system（跟随系统）
// 模块顶层读取持久化的 themeMode 并立即应用到 DOM，消除初始化过程中 1–2 帧浅色闪烁
const _savedThemeMode = (() => {
  try { return JSON.parse(localStorage.getItem('podcast_settings') || '{}').themeMode; } catch { return null; }
})();
// URL 参数 ?theme=light|dark|system 可强制覆盖（用于调试/对比，优先级最高）
const _forcedTheme = (() => {
  try {
    const t = new URLSearchParams(location.search).get('theme');
    return (t === 'light' || t === 'dark' || t === 'system') ? t : null;
  } catch { return null; }
})();
const _initialTheme = _forcedTheme || _savedThemeMode || 'light';
// 响应式系统深色模式偏好（通过 matchMedia change 事件驱动）
const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
let systemDarkMql = null;
// 把 "system" 解析为真实 light/dark：data-theme 只承载已解析结果，
// 外壳 CSS（variables.css）不再感知 system，从而真正跟随系统而非被写死成深色
const resolveMode = (mode) => (mode === 'system' ? (systemDark.value ? 'dark' : 'light') : mode);
document.documentElement.setAttribute('data-theme', resolveMode(_initialTheme));
const themeMode = ref(_initialTheme);
const applyThemeMode = (mode) => {
  themeMode.value = mode;
  document.documentElement.setAttribute('data-theme', resolveMode(mode));
};
const setThemeMode = (mode) => {
  applyThemeMode(mode);
  saveSettings();
};

// 当前是否为深色模式（用于编辑区和预览区样式计算）
const isDarkMode = computed(() => {
  if (themeMode.value === 'dark') return true;
  if (themeMode.value === 'system') return systemDark.value;
  return false;
});

const previewPosition = ref('right');
const previewWidth = ref(320);
const phoneModel = ref('iphone-14');

const togglePanel = (panel) => {
  activePanel.value = activePanel.value === panel ? null : panel;
};

// ---------- 拖拽调整宽度 ----------
let isResizing = false;

const startResize = (e) => {
  isResizing = true;
  // 用 handle 自身捕获指针，触屏拖拽不丢手势、不抢页面滚动
  if (e && e.pointerId !== undefined && e.currentTarget) {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  }
  document.addEventListener('pointermove', onResize);
  document.addEventListener('pointerup', stopResize);
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
  document.removeEventListener('pointermove', onResize);
  document.removeEventListener('pointerup', stopResize);
};

// ---------- 装饰 ----------
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

// AI 前置说明：首次打开提示「需自备 Key、仅本地直连厂商」，可关闭且记忆
const aiIntroSeen = ref(localStorage.getItem('podcast_ai_intro_seen') === '1');
const dismissAiIntro = () => {
  aiIntroSeen.value = true;
  localStorage.setItem('podcast_ai_intro_seen', '1');
};

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

// 加载草稿时清理：复用 stripBareDirectives 中和「默认占位装饰种子块」
// （::: cover/divider/quote\n点击编辑文字\n::: 及其转义变体）。
// 这是 Bug A 的 misparse 种子，必须在解析前清除（见 buildHtml.stripBareDirectives 注释）。
const normalizeStaleWelcome = (md) => stripBareDirectives(md);

const markdownText = ref(DEFAULT_CONTENT);
const { savedLabel, showRecoveryBanner, saveDraft, saveDraftNow, loadDraft: loadDraft_ } = useDraft(markdownText);
const { brandColor, brandFont, loadBrand, saveBrand, clearBrandColor: _brandClearColor, clearBrandFont: _brandClearFont } = useBrand();
const milkdownContainer = ref(null);
let milkdownEditor = null;
let isFromEditor = false;
let isSettingEditor = false;
const previewHtml = ref('');
const previewWechatDark = ref(false); // 预览「模拟微信深色模式」开关（仅影响预览，不影响导出）
const currentTheme = ref('serif_news');

// ---------- 样式调节 ----------
const selectedTag = ref('h2');
const tempFontSize = ref(22);
const tempColor = ref('#07c160');
const tempLineHeight = ref(1.8);
const tempLetterSpacing = ref(0);
const customOverrides = ref({});

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
  loadDraft_();
  // 清理草稿里残留的封面占位块（避免与裸 ::: 错位误判成封面卡片）
  markdownText.value = normalizeStaleWelcome(markdownText.value);
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
      // URL 强制主题 (?theme=) 优先级高于存档，便于调试对比
      if (!_forcedTheme && settings.themeMode) applyThemeMode(settings.themeMode);
    } catch (e) {
      console.warn('设置数据损坏，已重置:', e);
      localStorage.removeItem('podcast_settings');
    }
  }
  // 加载品牌设置
  loadBrand();
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

const saveSettings = () => {
  const settings = {
    previewPosition: previewPosition.value,
    previewWidth: previewWidth.value,
    phoneModel: phoneModel.value,
    showPreview: showPreview.value,
    theme: currentTheme.value,
    themeMode: themeMode.value
  };
  localStorage.setItem('podcast_settings', JSON.stringify(settings));
};

// Onboarding 新手引导
const showOnboarding = ref(false);
const onboardingStep = ref(1);

// 上下文工具栏：选区类型
const selectedType = ref(null); // null | 'text' | 'heading'
const selectionLength = ref(0);

// 选区格式化命令（上下文栏：短文/选中文字时使用，避免空白死路）
const runMilkdownCommand = (cmd, payload) => {
  if (!milkdownEditor) return;
  milkdownEditor.action((ctx) => {
    const commands = ctx.get(commandsCtx);
    if (payload !== undefined) commands.call(cmd.key, payload);
    else commands.call(cmd.key);
  });
};
const formatBold = () => runMilkdownCommand(toggleStrongCommand);
const formatItalic = () => runMilkdownCommand(toggleEmphasisCommand);
const formatLink = () => {
  const url = window.prompt('请输入链接地址（https://...）');
  if (!url) return;
  runMilkdownCommand(toggleLinkCommand, { href: url, title: '' });
};

// 字数统计（去 Markdown 语法、链接、图片标记后的纯文本字数）
const wordCount = computed(() => {
  const plain = markdownText.value
    .replace(/^#+\s+/gm, '')  // 标题标记
    .replace(/[>*_~`|]/g, '')  // 符号
    .replace(/!\[.*?\]\(.*?\)/g, '')  // 图片
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')  // 链接保留文本
    .replace(/\s+/g, '');  // 空白
  return plain.length;
});

// 预估阅读时长（中文 ~400 字/分钟）
const readTime = computed(() => Math.max(1, Math.round(wordCount.value / 400)));

// AI 场景化推荐：根据编辑器内容智能推荐最合适的操作
const aiRecommendations = computed(() => {
  const md = markdownText.value;
  const hasContent = md.trim().length > 20;
  const hasHeadings = /^#{1,3}\s/m.test(md);
  const isLong = wordCount.value > 500;
  const all = [
    { key: 'generateTitle', label: '✨ 生成标题', desc: 'AI 为文章起一个好标题' },
    { key: 'writeSummary', label: '📝 写摘要', desc: '自动提炼文章核心要点' },
    { key: 'expand', label: '🔍 扩写段落', desc: '丰富细节，扩展成更长内容' },
    { key: 'structure', label: '📐 结构化排版', desc: '补充小标题、合理分段、加粗重点' },
  ];
  // 无内容 → 优先生成标题
  if (!hasContent) return { primary: [all[0]], rest: all.slice(1) };
  // 长文无标题 → 结构化 + 摘要
  if (isLong && !hasHeadings) return { primary: [all[3], all[1]], rest: [all[0], all[2]] };
  // 长文有标题 → 摘要 + 扩写
  if (isLong) return { primary: [all[1], all[2]], rest: [all[0], all[3]] };
  // 短文 → 扩写 + 结构化
  return { primary: [all[2], all[3]], rest: [all[0], all[1]] };
});

// THEMES / THEME_NAMES 已提取到 src/themes.js

// buildHtml 已提取到 src/buildHtml.js

// 渲染 HTML（含品牌与预览模式）；复制/导出恒定微信白底。
// wechatDark 仅预览「模拟微信深色模式」开关使用，复制/导出调用不传（保持浅色）。
const currentBrand = () => ({
  color: brandColor.value,
  font: brandFont.value ? (BRAND_FONTS[brandFont.value] || '') : ''
});
const renderHtml = (wechatDark = false) =>
  DOMPurify.sanitize(buildHtml(
    markdownText.value, currentTheme.value, customOverrides.value, currentBrand(),
    { wechatDark }
  ));

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

// 估算编辑器当前选区在 markdown 文本中的插入位置（用于在光标处插入内容）
// 直接从 ProseMirror selection.from 取值，不依赖字符串搜索（lastIndexOf 在重复文本中偏移）
const getEditorMarkdownOffset = () => {
  if (!milkdownEditor) return markdownText.value.length;
  try {
    return milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      return view.state.selection.from;
    });
  } catch (_) {
    return markdownText.value.length;
  }
};

// 用 replaceAll 安全替换编辑器内容（外部按钮/AI/导入等统一入口）
const setEditorMarkdown = (md) => {
  // 所有进入编辑器解析的入口统一先做裸 ::: 清理（见 stripBareDirectives / Bug A），
  // 否则裸 ::: 与草稿里可能的 ::: cover 占位块会错位误判成封面卡片。
  const clean = stripBareDirectives(md);
  if (milkdownEditor) {
    isSettingEditor = true;
    milkdownEditor.action(replaceAll(clean));
    // 必须同步回写 markdownText：预览/复制/导出 (renderHtml) 都读 markdownText.value，
    // 而 markdownUpdated 监听器在 isSettingEditor 期间会早退、不回写，若这里不补，
    // 程序化改写的装饰块/图片/AI 结果会出现「编辑区有、预览与复制结果没有」的滞后。
    markdownText.value = clean;
    isSettingEditor = false;
  } else {
    markdownText.value = clean;
  }
};

// 把 THEMES 转为 CSS 规则，注入 .milkdown-theme-editor 容器
// 与 buildHtml 共用同一份 THEMES + 品牌色 + 覆盖逻辑，保证所见即所得
const editorThemeCss = computed(() => {
  const base = THEMES[currentTheme.value] || THEMES.serif_news;
  let t = { ...base };
  const brand = currentBrand();

  // 品牌色/字体重染（使用共享函数，保证与 buildHtml 一致，且必须在 themeAccent 提取之前）
  applyBrandToTheme(t, brand);
  // 深色模式：整主题派生为暗色版（背景转暗、正文转浅、强调色提亮），
  // 不再只改 body 底色——否则 h1/p/li 仍是浅色主题色值在深底下看不见。
  // 浅色模式：沿用白底深字（与公众号白底阅读一致）。
  if (isDarkMode.value) {
    t = deriveDarkTheme(t);
  } else {
    t.body = t.body
      .replace(/background:[^;]+/, 'background:#ffffff')
      .replace(/color:[^;]+/, 'color:#1a1a1a');
  }

  // 装饰元素配色：从品牌覆盖后的 t 提取，与 buildHtml 完全一致
  const themeAccent = (t.h1 || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#333';
  const quoteBg = (t.blockquote || '').match(/background:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || _brandShade(themeAccent, 82);
  const quoteText = (t.blockquote || '').match(/color:\s*(#[0-9a-fA-F]{3,8})/i)?.[1] || '#555';
  const decorColor = brand.color || themeAccent;

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
  // 空封面/金句块的占位提示（插入时不含「点击编辑文字」文字，避免成为 misparse 种子，故用 CSS 提示）
  rules.push(`.milkdown-theme-editor .milkdown-decor-cover h1:empty::before { content: "点击编辑文字"; color: #b9b9b9; font-weight: 400; }`);
  rules.push(`.milkdown-theme-editor .milkdown-decor-quote:empty::before { content: "点击编辑文字"; color: #b9b9b9; }`);
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
      if (ov['letter-spacing']) parts.push(`letter-spacing:${ov['letter-spacing']}`);
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
    previewHtml.value = renderHtml(previewWechatDark.value);
  } catch (error) {
    console.error('转换失败:', error);
    previewHtml.value = '<p style="color:#e03e3e;">⚠️ 内容解析失败，请检查 Markdown 语法</p>';
  }
};
// 切换「模拟微信深色模式」时重渲染预览
watch(previewWechatDark, () => convertMarkdown());

// 样式调节逻辑（useStyle composable）
const { loadTagStyle, applyCustomStyle, resetTagStyle,
  applyThemeToAll: _applyThemeToAll } = useStyle(
  customOverrides, selectedTag,
  tempFontSize, tempColor, tempLineHeight, tempLetterSpacing,
  convertMarkdown, showToast
);
// 包装：模板调用无参，composable 需要 currentTheme
const applyThemeToAll = () => _applyThemeToAll(currentTheme);

// ---------- 品牌色 / 字体（Gamma 式重染）----------
const BRAND_FONTS = {
  serif: "'SimSun','Songti SC','Noto Serif SC',serif",
  sans: "'Microsoft YaHei','PingFang SC','Hiragino Sans GB',sans-serif",
  kai: "'KaiTi','STKaiti','Noto Serif SC',serif",
  deng: "'DengXian','PingFang SC','Microsoft YaHei',sans-serif"
};

const applyBrand = () => {
  saveBrand();
  convertMarkdown();
};

// clearBrandColor 包装以触发 convertMarkdown
const clearBrandColor = () => {
  _brandClearColor();
  convertMarkdown();
};

// clearBrandFont 包装以触发 convertMarkdown（与 clearBrandColor 对称）
const clearBrandFont = () => {
  _brandClearFont();
  convertMarkdown();
};

// ---------- Milkdown 装饰节点插件（cover / divider / quote） ----------
// 让 ::: 容器语法在编辑器内可视化，并与 buildHtml 输出保持一致
// 实现方式与 POC 验证通过的代码完全对齐

const createDirectiveNode = (type) => $nodeSchema(type, () => ({
  content: type === 'divider' ? '' : 'text*',
  group: 'block',
  defining: true,
  isolating: true,
  attrs: { type: { default: type } },
  parseMarkdown: {
    match: (node) => node.type === 'containerDirective' && node.name === type,
    runner: (state, node, nodeType) => {
      // 容器指令的子节点是「块级节点」(如 paragraph)，其文本在 children[].value 或
      // 更深层的 children 里；不能只取顶层 c.value（顶层是 paragraph，没有 value）。
      // 必须递归收集所有文本，否则封面/金句的标题文字会丢失（此前 ::: 语法未生效，此 bug 潜伏）。
      const collect = (n) => {
        if (n.value != null) return n.value;
        if (Array.isArray(n.children)) return n.children.map(collect).join('');
        return '';
      };
      const text = (node.children || []).map(collect).join('');
      state.openNode(nodeType, { type });
      if (type !== 'divider' && text) state.addText(text);
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (n) => n.type.name === type,
    runner: (state, node) => {
      state.openNode('containerDirective', { name: type });
      // 注意：此处 state 是「序列化器状态(SerializerStack)」，没有 addText 方法。
      // 加文本必须用 state.next(node.content) 递归交给文本节点自行序列化
      // （与 Milkdown preset-commonmark 的 paragraph toMarkdown 一致）。
      // 之前误用 state.addText 会在插入 quote/cover 时抛
      // "addText is not a function"，导致整个文档序列化崩溃、预览错位。
      if (type !== 'divider') {
        state.next(node.content);
      }
      state.closeNode();
    },
  },
  toDOM: () => {
    if (type === 'cover') {
      return ['div', { class: 'milkdown-decor-cover', 'data-decor-type': 'cover' }, ['h1', 0]];
    }
    if (type === 'divider') {
      return ['div', { class: 'milkdown-decor-divider', 'data-decor-type': 'divider' }, ['span', '※ ※ ※']];
    }
    return ['section', { class: 'milkdown-decor-quote', 'data-decor-type': 'quote' }, 0];
  },
  parseDOM: [
    { tag: `div.milkdown-decor-${type}` },
    ...(type === 'quote' ? [{ tag: `section.milkdown-decor-${type}` }] : []),
  ],
}));

const coverDirective = createDirectiveNode('cover');
const dividerDirective = createDirectiveNode('divider');
const quoteDirective = createDirectiveNode('quote');



// 光标处插入装饰块（::: container 语法，编辑器内可视化）
const insertDecorBlock = (type) => {
  const labels = { cover: '封面卡片', divider: '分割线', quote: '金句卡片' };
  // 插入「空内容」装饰块，占位提示「点击编辑文字」由 CSS :empty::before 渲染（见 editorThemeCss）。
  // 关键点：绝不能插入带「点击编辑文字」占位文字的块。该文字会与文档中偶发的裸 ::: 相邻，
  // 被浏览器 remark-directive 误判成真 cover 节点（并产生自我循环的裸 ::: artifact）。
  // 空块序列化为 `:::cover\n\n:::`（注意：remark-directive 语法要求 ::: 后「无空格」紧跟类型名，
  // 写成 `::: cover` 会被当成普通文本而不解析为容器节点）。无任何内部文本，不会成为 misparse 种子。
  const blockText = '\n:::' + type + '\n\n:::\n';

  if (milkdownEditor) {
    // 直接 Markdown 文本操作 + setEditorMarkdown（replaceAll），
    // 确保 remark-directive 正确解析 ::: 容器语法为可视化节点
    // 注意：insertText('::: syntax') 不会触发 remark-directive 解析，
    // 因为 insertText 跳过 Markdown 解析器直接写 ProseMirror 文本节点
    const offset = getEditorMarkdownOffset();
    const md = markdownText.value;
    const newMd = md.slice(0, offset) + blockText + md.slice(offset);
    setEditorMarkdown(newMd);
  } else {
    const md = markdownText.value;
    const newMd = md + blockText;
    markdownText.value = newMd;
  }
  showToast(`已插入${labels[type] || '装饰元素'}`, 'success');
};

// ===== 上下文工具栏：标题层级 =====
const setHeadingLevel = (level) => {
  if (!milkdownEditor) return;
  try {
    // 通过 execCommand 修改标题层级
    milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      if (!view) return;
      const { state } = view;
      // 使用 ProseMirror 的 setBlockType 来设置标题层级
      const nodeType = state.schema.nodes.heading;
      if (nodeType) {
        const tr = state.tr;
        view.dispatch(tr.setBlockType(state.selection.from, state.selection.to, nodeType, { level }));
      }
    });
    // 同步 markdownText（设 isSettingEditor 防止 sync watcher 执行 replaceAll）
    nextTick(() => {
      isSettingEditor = true;
      markdownText.value = getMarkdown();
      isSettingEditor = false;
    });
    showToast(`已设为 H${level}`, 'success');
  } catch (_) {
    showToast('设置失败，请确保光标在文本行上', 'error');
  }
};

// ===== 选区辅助：从 ProseMirror 获取精确的选中 Markdown 文本 =====
// 使用 serializer 而非 window.getSelection()，因为 DOM 选区丢失了 markdown 格式标记（如 **bold**）
const getSelectedMarkdown = () => {
  if (!milkdownEditor) {
    return window.getSelection()?.toString().trim() || '';
  }
  try {
    return milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { from, to, empty } = view.state.selection;
      if (empty) return '';
      const serializer = ctx.get(serializerCtx);
      return serializer(view.state.doc.slice(from, to).content);
    });
  } catch (_) {
    return window.getSelection()?.toString().trim() || '';
  }
};

// 用 Markdown 文本替换编辑器选中内容（文档级区间替换，避免序列化不一致）
// 返回 true 表示替换成功；选区为空或解析失败返回 false（供调用方弹错误提示）
const replaceSelectedWith = (replacement) => {
  if (!milkdownEditor) return false;
  try {
    return milkdownEditor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { from, to, empty } = view.state.selection;
      if (empty) return false;
      // replaceRange 走 parserCtx → Slice 的官方路径，自动处理选区跨块边界
      replaceRange(replacement, { from, to })(ctx);
      return true;
    });
  } catch (_) {
    return false;
  }
};

// 载入示例文章（空状态引导用）
const loadSampleArticle = () => {
  setEditorMarkdown(DEFAULT_CONTENT);
  showToast('已载入示例文章，可以开始体验了', 'success');
};

// 新手引导：完成 onboarding
const finishOnboarding = () => {
  const settings = JSON.parse(localStorage.getItem('podcast_settings') || '{}');
  settings.onboardingDone = true;
  localStorage.setItem('podcast_settings', JSON.stringify(settings));
  showOnboarding.value = false;
  // B9：结束即进入空编辑态，不再静默覆盖（可能已恢复的）草稿
};

// 新手引导：跳过 onboarding
const skipOnboarding = () => {
  const settings = JSON.parse(localStorage.getItem('podcast_settings') || '{}');
  settings.onboardingDone = true;
  localStorage.setItem('podcast_settings', JSON.stringify(settings));
  showOnboarding.value = false;
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
// TurndownService 单例（缓存复用，避免每次导入都 new 实例）
const _turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });

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
    md = _turndown.turndown(cleaned);
  } else {
    md = raw;
  }
  const finalMd = md.trim();
  const charCount = finalMd.length; // 中文按字符计，符合用户直觉
  setEditorMarkdown(finalMd);
  importText.value = '';
  activePanel.value = null; // 导入完成后关闭面板，明确反馈去向
  // 导入后跳转到编辑器顶部，便于从开头审阅
  nextTick(() => {
    const view = milkdownEditor?.action((ctx) => ctx.get(editorViewCtx));
    if (view && view.dom) view.dom.scrollTop = 0;
  });
  showToast(`已导入 ${charCount} 字`, 'success');
};

// ---------- 复制 HTML ----------
const copyHtml = async () => {
  // 复制恒定微信白底
  const htmlToCopy = renderHtml();
  if (!htmlToCopy) {
    showToast('没有内容可复制', 'error');
    return;
  }
  // B12：仅当正文含本地 base64 图片时才提示素材库问题（外链图 ![alt](url) 不告警）
  const hasBase64 = /data:(image|application)\//.test(htmlToCopy);
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = new Blob([htmlToCopy], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
      onCopySuccess(hasBase64);
      return;
    }
    throw new Error('ClipboardItem 不可用');
  } catch (err) {
    // 兜底：把微信白底 HTML 放进隐藏节点，复制其富文本内容（微信可直接识别）
    // 用 try/finally 确保无论 execCommand 是否抛异常，DOM 节点都被清理
    const tmp = document.createElement('div');
    let cleanup = false;
    try {
      tmp.style.position = 'fixed';
      tmp.style.left = '-9999px';
      tmp.innerHTML = htmlToCopy;
      document.body.appendChild(tmp);
      cleanup = true;
      const range = document.createRange();
      range.selectNodeContents(tmp);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(tmp);
      cleanup = false;
      if (ok) {
        onCopySuccess(hasBase64);
        return;
      }
      throw new Error('execCommand 复制失败');
    } catch (e2) {
      showToast('复制失败，请手动框选预览区内容复制', 'error');
      console.error(e2);
    } finally {
      // execCommand 抛异常后清理 DOM 和选区，防止节点泄露
      if (cleanup) {
        try {
          window.getSelection()?.removeAllRanges();
          if (tmp.parentNode) tmp.parentNode.removeChild(tmp);
        } catch (_) {}
      }
    }
  }
};

// B4：复制成功后的发布闭环轻引导（常驻，含一键开微信 + 自检清单）
const onCopySuccess = (hasBase64) => {
  publishGuide.value = true;
  if (hasBase64) {
    showToast('HTML 已复制。⚠️ 图片为本地 base64 数据，微信会替换为「…」—— 请到微信素材库上传原图后替换。', 'warning', 6000);
  } else {
    showToast('HTML 已复制，去微信后台粘贴即可发布', 'success');
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
  showToast('已跳转微信后台，粘贴后检查图片是否显示，装饰/金句/分割线自动保留样式', 'success');
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

// v-model 拆分后：watch 保持 onAiPresetChange / saveAiConfig 副作用
watch(aiPreset, () => onAiPresetChange());
watch([aiKey, aiBaseUrl, aiModel], () => saveAiConfig());

const saveAiConfig = () => {
  localStorage.setItem('podcast_ai_config', JSON.stringify({
    key: aiKey.value,
    preset: aiPreset.value,
    baseURL: aiBaseUrl.value,
    model: aiModel.value
  }));
};

// callAI 包装：注入 Vue reactive 依赖
let _currentOp = { cancel: () => {} };
const callAI = async (systemPrompt, userPrompt) => {
  const op = _extCallAI(systemPrompt, userPrompt, {
    key: aiKey,
    baseURL: aiBaseUrl,
    model: aiModel,
    loading: aiLoading,
    showToast
  });
  _currentOp = op;  // 立即保存操作对象，可在请求完成前取消
  return op.promise;  // 返回 Promise<string|null>
};
const cancelAI = () => { _currentOp.cancel(); };

const runAiAction = (key) => {
  const actions = {
    generateTitle: aiGenerateTitle,
    writeSummary: aiWriteSummary,
    expand: aiExpand,
    structure: aiStructure,
  };
  if (actions[key]) actions[key]();
};

const aiGenerateTitle = async () => {
  const res = await callAI(
    '你是公众号爆款标题专家。根据文章内容，给出 3 个吸引点击的标题，每个一行，不要编号、不要符号、不要引号。',
    markdownText.value.slice(0, 4000)
  );
  if (!res) return;
  const titles = res.split('\n').map(s => {
    const cleaned = s.replace(/^#+\s*/, '').replace(/^[-\d.\s、]+/, '').replace(/^[""']|[""']$/g, '').trim();
    // 如果 strip 后为空，保留原始内容做兜底
    return cleaned || s.trim();
  }).filter(Boolean);
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
  const sel = getSelectedMarkdown();
  const source = sel || markdownText.value;
  const label = sel ? '选中内容' : '全文';
  const res = await callAI(
    '你是公众号写手。请在不改变原意的前提下，把下面内容扩写到约 1.5-2 倍长度，保持 Markdown 格式，语言更生动。',
    source.slice(0, 4000)
  );
  if (!res) return;
  if (sel) {
    if (!replaceSelectedWith(res)) {
      showToast('替换失败，请重新选中后重试', 'error');
      return;
    }
  } else {
    setEditorMarkdown(markdownText.value + '\n\n' + res);
  }
  showToast('已扩写' + label, 'success');
};

const aiRewrite = async () => {
  const sel = getSelectedMarkdown();
  const source = sel || markdownText.value;
  const label = sel ? '选中内容' : '全文';
  const res = await callAI(
    '你是公众号写手。请改写下面内容：保持 Markdown 格式和核心信息不变，但让表达更流畅、更有可读性。只输出改写后的内容，不要解释。',
    source.slice(0, 4000)
  );
  if (!res) return;
  if (sel) {
    if (!replaceSelectedWith(res)) {
      showToast('替换失败，请重新选中后重试', 'error');
      return;
    }
  } else {
    setEditorMarkdown(res.trim());
  }
  showToast('已改写' + label, 'success');
};

const aiTranslate = async () => {
  const sel = getSelectedMarkdown();
  const source = sel || markdownText.value;
  if (!source.trim()) { showToast('请先选中文字或输入内容', 'error'); return; }
  const res = await callAI(
    '你是专业翻译。请将下面内容翻译成中文，保持 Markdown 格式不变。只输出译文，不要解释。',
    source.slice(0, 4000)
  );
  if (!res) return;
  if (sel) {
    if (!replaceSelectedWith(res)) {
      showToast('替换失败，请重新选中后重试', 'error');
      return;
    }
  } else {
    setEditorMarkdown(res.trim());
  }
  showToast('已翻译', 'success');
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
const selectTheme = (key) => {
  if (currentTheme.value !== key) {
    currentTheme.value = key;
    onThemeChange();
  }
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
  const willReplace = (!isFromEditor && !isSettingEditor && milkdownEditor);
  if (import.meta.env?.DEV) console.warn('[SYNCWATCH] isFromEditor=', isFromEditor, 'isSettingEditor=', isSettingEditor, 'willReplace=', willReplace, 'hasCover=', /:::\s*cover/.test(newMd), 'snip=', JSON.stringify(newMd.slice(0, 80)));
  // 加 !isSettingEditor 闸门：程序化改写（setEditorMarkdown/insert*）已显式同步 markdownText，
  // 避免这里又把它 replaceAll 推回编辑器，造成冗余事务 / 光标重置。
  // 进入编辑器解析前统一做裸 ::: 清理，防止错位误判成封面卡片。
  if (willReplace) {
    isSettingEditor = true;
    if (import.meta.env?.DEV) {
      const v0 = milkdownEditor.action(ctx => ctx.get(editorViewCtx));
      const t0 = []; v0.state.doc.forEach(n => t0.push(n.type.name));
      console.warn('[SYNCWATCH→replaceAll] BEFORE doc=', JSON.stringify(t0), 'md=', JSON.stringify(newMd.slice(0,80)));
    }
    milkdownEditor.action(replaceAll(stripBareDirectives(newMd)));
    if (import.meta.env?.DEV) {
      const v1 = milkdownEditor.action(ctx => ctx.get(editorViewCtx));
      const t1 = []; v1.state.doc.forEach(n => t1.push(n.type.name + (n.textContent?':'+JSON.stringify(n.textContent.slice(0,8)):'')));
      console.warn('[SYNCWATCH→replaceAll] AFTER  doc=', JSON.stringify(t1));
    }
    isSettingEditor = false;
  }
}, { flush: 'sync' });

// 监听设置变化
watch([previewPosition, previewWidth, phoneModel, showPreview], () => {
  saveSettings();
});

// ---------- 键盘快捷键 ----------
const onKeydown = (e) => {
  // 中文输入法（IME）打字时跳过快捷键，避免 Ctrl+S/C 等打断候选词输入
  if (e.isComposing) return;
  // 表单控件（输入框/文本域/下拉）聚焦时不触发全局快捷键，避免干扰 AI 提示词、品牌色、选项填写
  const tag = e.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  const k = e.key.toLowerCase();
  // Ctrl/Cmd + Shift + C → 复制 HTML
  if (e.shiftKey && k === 'c') {
    e.preventDefault();
    copyHtml();
  }
  // Ctrl/Cmd + Shift + P → 切换预览
  else if (e.shiftKey && k === 'p') {
    e.preventDefault();
    showPreview.value = !showPreview.value;
  }
  // Ctrl/Cmd + S → 保存草稿到本机（拦截浏览器「保存网页」）
  else if (k === 's') {
    e.preventDefault();
    saveDraftNow();
    saveSettings();
    showToast('已保存到本机', 'success');
  }
  // Ctrl/Cmd + / → 切换快捷键帮助
  else if (k === '/') {
    e.preventDefault();
    showShortcuts.value = !showShortcuts.value;
  }
};

// ---------- 初始化 ----------
onMounted(async () => {
  loadFromStorage();
  // 新手引导：首次使用且无草稿时展示
  // B9：恢复横幅优先——有可恢复草稿时不弹 Onboarding（避免首屏冲突/覆盖）
  const settings = JSON.parse(localStorage.getItem('podcast_settings') || '{}');
  if (!settings.onboardingDone && !localStorage.getItem('podcast_draft') && !showRecoveryBanner.value) {
    showOnboarding.value = true;
  }
  // 移动端默认隐藏预览
  if (window.matchMedia('(max-width: 768px)').matches) {
    showPreview.value = false;
  }

  // 初始化 Milkdown 编辑器
  try {
    milkdownEditor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, milkdownContainer.value);
        // 进入编辑器解析前先做裸 ::: 清理，防止与草稿里可能的 ::: cover 占位块错位误判
        ctx.set(defaultValueCtx, stripBareDirectives(markdownText.value));
        if (import.meta.env?.DEV) console.warn('[INIT] defaultValueCtx snip=', JSON.stringify(stripBareDirectives(markdownText.value).slice(0, 80)));
        // listener: 编辑器内容变化 → 同步到 markdownText
        ctx.get(listenerCtx).markdownUpdated((_, md) => {
          if (isSettingEditor) return;
          if (import.meta.env?.DEV) console.warn('[MDUPD] rawHasCover=', /:::\s*cover/.test(md), 'rawHasBare=', /^[ \t]*:::[ \t]*$/m.test(md), 'snip=', JSON.stringify(md.slice(0, 80)));
          if (import.meta.env?.DEV) {
            try {
              const v = milkdownEditor.action(ctx => ctx.get(editorViewCtx));
              const t = []; v.state.doc.forEach(n => t.push(n.type.name + (n.textContent?':'+JSON.stringify(n.textContent.slice(0,8)):'')));
              console.warn('[MDUPD] editorDoc=', JSON.stringify(t));
            } catch(e) {}
          }
          // 还原 remark-directive 转义 + 剔除空段落序列化产生的「裸 :::」artifact
          // （stripBareDirectives 内含转义还原与栈式精准剔除，详见函数注释 / Bug A 根因）。
          // 这是编辑器端「封面卡片幽灵块」的最后一道防线：无论裸 ::: 来自何处，
          // 只要进不了 markdownText，预览与后续解析都不会再误判成 cover 节点。
          md = stripBareDirectives(md);
          isFromEditor = true;
          markdownText.value = md;
          isFromEditor = false;
        });
      })
      .use(listener)
      .use(remarkDirective)
      .use(coverDirective)
      .use(dividerDirective)
      .use(quoteDirective)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(forceParagraphEnter)
      .use(headingEnterFix)
      .create();
    // 调试钩子：暴露编辑器实例与 view，便于 puppeteer 包裹 dispatchTransaction 定位 Enter bug
    if (typeof window !== 'undefined') {
      window.__milkdownEditor = milkdownEditor;
      try {
        window.__milkdownView = milkdownEditor.action((ctx) => ctx.get(editorViewCtx));
      } catch (_) {}
    }
  } catch (e) {
    console.error('Milkdown 初始化失败:', e);
  }

  // 首屏一次性重渲染：仅在内容含 ::: 语法时强制执行，确保 cover/divider/quote
  // 容器被渲染为卡片而非回退为纯文本。无 ::: 的内容跳过避免无意义地 reset 光标/选区。
  // 进入解析前统一做裸 ::: 清理（防御草稿里残留的裸 ::: / 占位块错位）。
  if (milkdownEditor && markdownText.value.trim() && /:::\s*(cover|divider|quote)/.test(markdownText.value)) {
    try {
      isSettingEditor = true;
      milkdownEditor.action(replaceAll(stripBareDirectives(markdownText.value)));
      isSettingEditor = false;
    } catch (e) {
      isSettingEditor = false;
      console.warn('首屏重渲染跳过:', e);
    }
  }

  convertMarkdown();

  // 选区轮询：驱动顶部上下文工具栏
  const selTimer = setInterval(() => {
    if (!milkdownEditor) return;
    try {
      const view = milkdownEditor.action(ctx => ctx.get(editorViewCtx));
      if (!view || !view.state) return;
      const { selection } = view.state;
      const { from, to, empty } = selection;
      selectionLength.value = to - from;
      if (empty || selectionLength.value === 0) {
        selectedType.value = null;
        return;
      }
      const selNode = selection.node;
      if (selNode && selNode.type.name === 'heading') {
        selectedType.value = 'heading';
      } else if (selNode && selNode.type.name === 'image') {
        selectedType.value = null; // 图片暂无专用操作，不显示空白栏
      } else if (!empty) {
        selectedType.value = 'text'; // 任意长度文字均显示上下文栏
      } else {
        selectedType.value = null;
      }
    } catch (_) {
      selectedType.value = null;
    }
  }, 500);
  onUnmounted(() => clearInterval(selTimer));
  if (showRecoveryBanner.value) {
    setTimeout(() => { showRecoveryBanner.value = false; }, 10000);
  }

  window.addEventListener('keydown', onKeydown);
  
  // 系统主题切换监听（驱动 systemDark ref 更新 → isDarkMode 响应式跟随）
  systemDarkMql = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemThemeChange = (e) => {
    systemDark.value = e.matches;
    // system 模式下实时跟随 OS：重设已解析的 data-theme，外壳即时切换明暗
    if (themeMode.value === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  };
  systemDarkMql.addEventListener('change', onSystemThemeChange);
  window._onSystemThemeChange = onSystemThemeChange;
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  // 移除系统主题切换监听
  if (systemDarkMql && window._onSystemThemeChange) {
    systemDarkMql.removeEventListener('change', window._onSystemThemeChange);
    delete window._onSystemThemeChange;
  }
  // 兜底清理拖拽宽度的 document 级监听器：若组件卸载瞬间用户仍在拖拽，
  // stopResize 不会触发，监听器将泄漏在 document 上，这里强制移除。
  document.removeEventListener('pointermove', onResize);
  document.removeEventListener('pointerup', stopResize);
  milkdownEditor?.destroy();
  milkdownEditor = null;
});
</script>

<style>
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
  /* 移动端浏览器地址栏会撑大 100vh，dvh 按可见视口计算，避免底部工具栏被顶出屏幕 */
  height: 100dvh;
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
  padding: 10px 0;
  flex-shrink: 0;
  z-index: 50;
}

.toolbar-brand {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.brand-icon {
  font-size: 22px;
}

.toolbar-divider {
  width: 28px;
  height: 1px;
  background: var(--border-light);
  margin: 6px 0;
}

.toolbar-spacer {
  flex: 1;
}

/* 工具栏分组（任务流） */
.toolbar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 4px 0;
}

.toolbar-group + .toolbar-group {
  border-top: 1px solid var(--border-light);
  margin-top: 4px;
  padding-top: 8px;
}

.toolbar-group-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
  padding: 2px 0 4px;
  opacity: 0.7;
}

.toolbar-item {
  width: 40px;
  height: 48px;
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

/* B5 三层叠放说明 */
.cascade-note {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--bg-hover);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  margin-bottom: 8px;
}
.cascade-note .cascade-title {
  display: inline-block;
  font-weight: 600;
  color: var(--accent-green);
  margin-right: 4px;
}
.cascade-note b {
  color: var(--text-primary);
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

/* 平板断点：768–1024px 区间布局收敛（B8 修复：面板改覆盖、编辑器最小宽≥480px） */
@media (max-width: 1024px) {
  .floating-panel {
    width: 280px;
  }
  /* 面板改为覆盖而非推挤：去掉 margin-left，编辑器保留完整宽度（B8） */
  .main-content.panel-open {
    margin-left: 0;
  }
  /* 面板打开时隐藏预览，避免与面板争抢宽度，确保编辑器可见宽度≥480px（B8） */
  .main-content.panel-open .preview-section {
    display: none;
  }
  /* 面板关闭时预览作为窄侧栏；宽度上限保证编辑器始终≥480px（769px 下限不溢出） */
  .preview-section {
    width: 26vw !important;
    max-width: 210px;
  }
  /* 编辑器最小宽度提升至 480px（对齐 B8 规范，写作区不为窄条） */
  .editor-section {
    min-width: 480px;
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
  position: relative;  /* 修复 ::before 绝对定位的偏移基准 */
  width: 6px;
  background: var(--bg-hover);
  cursor: col-resize;
  touch-action: none;  /* 触屏拖拽不抢页面滚动 */
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

/* 预览按钮 active 态（浅色模式使用 text-primary 做高亮） */
.preview-btn.active {
  background: var(--text-primary);
  color: white;
  border-color: var(--text-primary);
}

/* 深色模式下预览按钮 active 态使用强调蓝提升对比度 */
:root[data-theme="dark"] .preview-btn.active {
  background: var(--accent-blue);
  color: #fff;
  border-color: var(--accent-blue);
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

/* 深色模式下手机框用更深底色 + 更明显的边框/阴影，与白色文章内容形成鲜明层次 */
:root[data-theme="dark"] .phone-frame {
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
  border-color: var(--border-medium);
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

/* 深色模式下手机壳变暗，wechat 栏同步调暗 */
:root[data-theme="dark"] .phone-wechat-bar {
  background: #3c3c3c;
  border-bottom-color: #505050;
}

.phone-wechat-bar .wechat-title {
  font-size: 12px;
  font-weight: 500;
  color: #191919;
  pointer-events: none;
}

:root[data-theme="dark"] .phone-wechat-bar .wechat-title {
  color: #d4d4d4;
}

.wechat-back, .wechat-menu {
  flex-shrink: 0;
}

/* 深色模式：微信顶栏图标变亮 */
:root[data-theme="dark"] .wechat-back,
:root[data-theme="dark"] .wechat-menu {
  stroke: #8ab4f8;
}

.phone-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  font-size: 17px;
  line-height: 1.8;
  background: #ffffff;
  padding: 16px;
  /* 注意：空状态文字用 CSS 变量，深色模式自动适配；
     内部 buildHtml 输出的文章内容自带 color:#1a1a1a，不受此值影响 */
  color: var(--text-tertiary, #3e3e3e);
}

/* 深色模式下空状态文字使用足够对比度的浅色 */
:root[data-theme="dark"] .phone-content {
  color: var(--text-secondary, #aaa);
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
  padding: 40px 24px;
}

.empty-icon {
  font-size: 52px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 24px !important;
  max-width: 280px;
  line-height: 1.5;
}

.empty-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 28px;
}

.empty-feature {
  font-size: 12px;
  background: var(--bg-secondary);
  padding: 4px 12px;
  border-radius: 20px;
  color: var(--text-secondary);
  border: 0.5px solid var(--border-light);
}

.empty-sample-btn {
  padding: 10px 24px;
  font-size: 14px;
  background: var(--accent-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-fast);
  font-weight: 500;
}

.empty-sample-btn:hover {
  opacity: 0.9;
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

/* ========== 本地图片上传 ========== */
.image-upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.image-upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.image-upload-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}

.paste-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.image-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px 12px;
  margin-bottom: 10px;
  background: var(--bg-secondary);
  border: 1.5px dashed var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
  cursor: default;
}

.image-drop-zone:hover {
  border-color: var(--border-medium);
  background: var(--bg-hover);
}

.image-drop-zone.image-drop-active {
  border-color: var(--accent-blue);
  background: #e6f1fb;
  color: var(--accent-blue);
}

.drop-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

.image-drop-active .drop-text {
  color: var(--accent-blue);
}

.drop-hint {
  font-size: 10px;
  color: var(--text-tertiary);
  opacity: 0.7;
}

/* ========== 图片编辑面板 ========== */
.image-edit-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 0.5px solid var(--border-light);
  min-height: 100px;
}

.image-edit-thumb {
  max-width: 100%;
  max-height: 140px;
  border-radius: var(--radius-sm);
  object-fit: contain;
}

.image-edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.image-edit-actions .notion-btn-small {
  justify-content: center;
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

.toast.warning {
  background: #d97706;
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
  gap: 4px;
  padding: 5px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  font-size: 11px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  height: 26px;
}

.status-item {
  white-space: nowrap;
}

.status-sep {
  opacity: 0.3;
  margin: 0 2px;
}

.status-item.ai-status {
  color: var(--accent-blue, #4cb3d9);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.ai-spinner {
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--accent-blue, #4cb3d9);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ai-spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes ai-spin {
  to { transform: rotate(360deg); }
}

/* ========== 上下文工具栏 ========== */
.context-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  flex-shrink: 0;
  min-height: 34px;
}

.context-label {
  font-weight: 600;
  color: var(--text-tertiary);
  margin-right: 4px;
  white-space: nowrap;
}

.context-field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.context-field input[type="range"] {
  width: 60px;
  accent-color: var(--accent-blue, #4cb3d9);
}

.context-value {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 28px;
}

.context-btn {
  padding: 3px 8px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
  transition: background 0.15s ease;
}

.context-btn:hover {
  background: var(--bg-hover, #eee);
}

.context-btn.context-danger {
  color: #e74c3c;
  border-color: #e74c3c;
}

.context-close {
  margin-left: auto;
  border: none;
  background: none;
  font-size: 16px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
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

/* ========== 新手引导浮层 ========== */
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 13, 22, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(4px);
}

.onboarding-card {
  width: min(400px, 90vw);
  max-height: 90dvh;
  overflow-y: auto;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-light, #e3e0ec);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.32);
  padding: 32px 28px 24px;
  text-align: center;
}

.onboarding-steps {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.onboarding-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-light, #ddd);
  transition: all 0.3s ease;
}

.onboarding-dot.active {
  background: var(--accent-blue, #4cb3d9);
  transform: scale(1.3);
}

.onboarding-dot.done {
  background: var(--accent-green, #2ecc71);
}

.onboarding-body {
  margin-bottom: 24px;
}

.onboarding-icon {
  font-size: 48px;
  margin-bottom: 16px;
  line-height: 1;
}

.onboarding-body h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #1a1a2e);
  margin: 0 0 12px;
  line-height: 1.4;
}

.onboarding-body p {
  font-size: 14px;
  color: var(--text-secondary, #666);
  line-height: 1.6;
  margin: 0;
}

.onboarding-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.onboarding-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.onboarding-tag {
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.onboarding-next {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  background: var(--accent-blue, #4cb3d9);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.onboarding-next:hover {
  background: #3a9ec9;
}

.onboarding-next.onboarding-done {
  background: var(--accent-green, #2ecc71);
}

.onboarding-next.onboarding-done:hover {
  background: #27ae60;
}

.onboarding-skip {
  border: none;
  background: none;
  font-size: 12px;
  color: var(--text-tertiary, #999);
  cursor: pointer;
  padding: 4px 8px;
}

.onboarding-skip:hover {
  color: var(--text-secondary, #666);
}

/* ========== 快捷键帮助浮层 ========== */
.shortcuts-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 13, 22, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.shortcuts-card {
  width: min(440px, 90vw);
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-light, #e3e0ec);
  border-radius: 14px;
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.shortcuts-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.shortcuts-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 13.5px;
  color: var(--text-secondary, #787774);
  line-height: 1.5;
}
.shortcuts-list li span {
  margin-left: 4px;
  color: var(--text-primary, #37352f);
}
.shortcuts-list kbd {
  display: inline-block;
  padding: 3px 9px;
  font-family: var(--font-mono, ui-monospace, 'SF Mono', 'Consolas', monospace);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary, #37352f);
  background: var(--bg-secondary, #f7f6fa);
  border: 1px solid var(--border-medium, #d8d4e8);
  border-bottom-width: 2px;
  border-radius: 6px;
  font-weight: 500;
  letter-spacing: 0.02em;
  min-width: 24px;
  text-align: center;
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

/* ========== AI 前置说明 ========== */
.ai-intro-notice {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-left: 3px solid var(--accent, #7c5cff);
  border-radius: var(--radius-sm, 6px);
  padding: 12px 14px;
  margin-bottom: 16px;
}
.ai-intro-notice p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 10px;
}
.ai-intro-notice strong {
  color: var(--text-primary);
  font-weight: 600;
}
.ai-intro-dismiss {
  align-self: flex-start;
  padding: 5px 14px;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: var(--accent, #7c5cff);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.ai-intro-dismiss:hover {
  opacity: 0.88;
}
/* 深色模式：强调色提亮为亮紫，白字对比度不足，改用深色文字（≥6:1） */
:root[data-theme="dark"] .ai-intro-dismiss {
  color: var(--bg-primary);
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
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

/* 场景化推荐按钮（主要操作） */
.ai-rec-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  text-align: left;
}

.ai-rec-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-blue);
}

.ai-rec-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-rec-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.ai-rec-desc {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 更多操作折叠区 */
.ai-more-details {
  border-top: 1px solid var(--border-light);
  padding-top: 6px;
  margin-top: 2px;
}

.ai-more-summary {
  font-size: 11px;
  color: var(--text-tertiary);
  cursor: pointer;
  user-select: none;
  padding: 2px 0;
}

.ai-more-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding-top: 6px;
}

.ai-more-actions .notion-btn-small {
  justify-content: center;
  text-align: center;
}

.ai-actions .notion-btn-small {
  justify-content: center;
  text-align: center;
}

/* AI 加载行 + spinner */
.ai-loading-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ai-spinner {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-medium, #d8d4e8);
  border-top-color: var(--accent-blue, #534ab7);
  border-radius: 50%;
  animation: ai-spin 0.7s linear infinite;
}
@keyframes ai-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .ai-spinner { animation-duration: 2s; }
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
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    /* iPhone 底部安全区，避免横条被 Home Indicator 遮挡 */
    padding-bottom: max(6px, env(safe-area-inset-bottom));
    border-right: none;
    border-top: 1px solid var(--border-light);
    /* 横向滚动：小屏（≤375px）12 个图标不再溢出或被挤压变形 */
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    z-index: 100;
  }
  .left-toolbar::-webkit-scrollbar {
    display: none;
  }

  .toolbar-brand,
  .toolbar-divider {
    display: none;
  }

  .toolbar-spacer {
    display: none;
  }

  /* 移动端分组改为横向平铺，不再纵向堆叠（否则底部栏会被撑到 ~160px 高） */
  .toolbar-group {
    flex-direction: row;
    align-items: center;
    gap: 2px;
    padding: 0;
  }
  .toolbar-group + .toolbar-group {
    border-top: none;
    margin-top: 0;
    padding-top: 0;
    border-left: 1px solid var(--border-light);
    margin-left: 4px;
    padding-left: 6px;
  }
  .toolbar-group-label {
    display: none;
  }

  .toolbar-item .toolbar-label {
    display: none;
  }

  .toolbar-item {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
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
    /* 让出底部固定工具栏空间，避免编辑器/预览被遮挡 */
    padding-bottom: 56px;
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

  /* B2 预览头部在移动端避免溢出 */
  .preview-controls {
    flex-wrap: wrap;
    gap: 4px;
  }
  .wechat-dark-toggle {
    font-size: 11px;
    padding: 4px 8px;
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

/* 手机横屏：高度紧张，压缩底栏并保留编辑区空间 */
@media (max-width: 768px) and (orientation: landscape) {
  .left-toolbar {
    padding-top: 4px;
    padding-bottom: 4px;
  }
  .toolbar-item {
    width: 40px;
    height: 40px;
  }
  .mobile-preview-fab {
    top: 8px;
    right: 8px;
    padding: 6px 10px;
  }
}
</style>

<style scoped>
/* ========== Milkdown 编辑器样式 ========== */
.milkdown-theme-editor {
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
  transition: background var(--transition-normal);
}

:deep(.milkdown) {
  min-height: 100%;
  outline: none;
}

:deep(.milkdown .ProseMirror) {
  min-height: 100%;
  outline: none;
  color: var(--text-primary);
  word-wrap: break-word;
  white-space: pre-wrap;
}

/* 深色模式：编辑器编辑区域底色与外壳统一 */
:root[data-theme="dark"] :deep(.milkdown .ProseMirror) {
  color: #d4d4d4;
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
