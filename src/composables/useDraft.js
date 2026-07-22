// ========== 净排 · 草稿管理 ==========
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

/**
 * 草稿管理 composable：自动保存/恢复/状态追踪
 *
 * ⚠️ 使用约束：内部使用了 onMounted/onUnmounted 生命周期钩子，
 * 必须在组件的 setup() 期间同步调用（不能在条件分支、异步回调中调用）。
 *
 * @param {import('vue').Ref<string>} markdownText - 编辑器内容 ref
 */
export function useDraft(markdownText) {
  const lastSavedAt = ref(null);
  const now = ref(Date.now());
  const showRecoveryBanner = ref(false);
  let draftTimer = null;
  let clockTimer = null;

  // 保存时间文案
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

  // 从 localStorage 恢复草稿
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('podcast_draft');
    if (savedDraft && savedDraft.trim()) {
      markdownText.value = savedDraft;
      lastSavedAt.value = Date.now();
      showRecoveryBanner.value = true;
      return true;
    }
    return false;
  };

  // 保存草稿
  const saveDraft = () => {
    localStorage.setItem('podcast_draft', markdownText.value);
    lastSavedAt.value = Date.now();
  };

  // 自动保存：内容变化 3 秒后自动保存
  watch(markdownText, () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      saveDraft();
    }, 3000);
  });

  // 立即保存（快捷键触发时不等待 3s）
  const saveDraftNow = () => {
    clearTimeout(draftTimer);
    saveDraft();
  };

  // 定时器
  onMounted(() => {
    clockTimer = setInterval(() => { now.value = Date.now(); }, 15000);
  });

  onUnmounted(() => {
    clearTimeout(draftTimer);
    clearInterval(clockTimer);
    saveDraft(); // 退出时立即保存
  });

  return {
    lastSavedAt,
    savedLabel,
    showRecoveryBanner,
    saveDraft,
    saveDraftNow,
    loadDraft,
  };
}
