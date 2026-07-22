<template>
  <Transition name="publish-guide">
    <div v-if="visible" class="publish-guide" role="status" aria-live="polite">
      <div class="pg-head">
        <span class="pg-title">✓ HTML 已复制</span>
        <button class="pg-close" @click="$emit('close')" aria-label="关闭">×</button>
      </div>
      <p class="pg-tip">去微信后台粘贴即可发布。发布前请核对：</p>
      <ul class="pg-list">
        <li>封面 / 分割线 / 金句 自动生效</li>
        <li>外链图正常显示；<b>本地 base64 图需先传微信素材库</b>再替换</li>
        <li>读者开深色时微信自动反色，可用「微信深色」预览核对观感</li>
      </ul>
      <button class="pg-open" @click="$emit('open-wechat')">打开微信后台 →</button>
    </div>
  </Transition>
</template>

<script setup>
// 发布闭环引导卡片（B4）：复制成功后常驻轻引导，提供一键打开微信后台与粘贴自检清单。
// 纯展示组件，状态（publishGuide）与动作（openWeChat）由 App.vue 持有。
defineProps({ visible: Boolean });
defineEmits(['close', 'open-wechat']);
</script>

<style scoped>
.publish-guide {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  width: min(380px, 92vw);
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-light, #e3e0ec);
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 16px 48px rgba(20, 18, 30, 0.18);
  padding: 16px 18px;
  z-index: 900;
}
.pg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.pg-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f1d29);
}
.pg-close {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-tertiary, #9b98a8);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  border-radius: var(--radius-sm, 8px);
}
.pg-close:hover {
  background: var(--bg-hover, #ece9f2);
  color: var(--text-primary, #1f1d29);
}
.pg-tip {
  font-size: 13px;
  color: var(--text-secondary, #6b6878);
  margin: 0 0 8px;
}
.pg-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  font-size: 13px;
  color: var(--text-primary, #1f1d29);
}
.pg-list li {
  position: relative;
  padding-left: 18px;
  margin-bottom: 4px;
  line-height: 1.5;
}
.pg-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--accent, #07c160);
  font-weight: 700;
}
.pg-list b {
  color: #d97706;
  font-weight: 600;
}
.pg-open {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md, 12px);
  background: var(--accent, #07c160);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter var(--transition-fast, 120ms ease);
}
.pg-open:hover {
  filter: brightness(0.95);
}
@media (max-width: 768px) {
  .publish-guide {
    bottom: 72px; /* 让开移动端底部工具栏 */
  }
}
.publish-guide-enter-active,
.publish-guide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.publish-guide-enter-from,
.publish-guide-leave-to {
  transform: translate(-50%, 16px);
  opacity: 0;
}
</style>
